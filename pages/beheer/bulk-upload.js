import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory, ScanStorageFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import { fileToBase64, toDishArray } from '../../lib/utils';
import RequireAuth from '../../components/RequireAuth';

const CONCURRENCY = 3; // aantal scans dat tegelijk verwerkt wordt

const STATUS_LABEL = {
  wachtend: 'Wachtend…',
  herkennen: 'Bezig met herkennen…',
  opslaan: 'Bezig met opslaan…',
  klaar: 'Klaar',
  fout: 'Mislukt',
};

const STATUS_COLOR = {
  wachtend: colors.inkMuted,
  herkennen: colors.campfire,
  opslaan: colors.campfire,
  klaar: colors.forest,
  fout: colors.stamp,
};

export default function BulkUploadPage() {
  return (
    <RequireAuth>
      <BulkUploadContent />
    </RequireAuth>
  );
}

function BulkUploadContent() {
  const [items, setItems] = useState([]); // { id, file, status, error, entryId, naam }
  const [bezig, setBezig] = useState(false);

  const handleFiles = (e) => {
    const gekozen = Array.from(e.target.files || []);
    const nieuw = gekozen.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      file,
      status: 'wachtend',
      error: null,
      entryId: null,
      naam: null,
    }));
    setItems(nieuw);
  };

  const verwerkItem = async (item) => {
    const update = (patch) =>
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...patch } : it)));

    try {
      update({ status: 'herkennen', error: null });
      const base64Data = await fileToBase64(item.file);
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType: item.file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Herkenning mislukt');

      update({ status: 'opslaan' });
      const velden = { ...data, lekkersteEten: toDishArray(data.lekkersteEten).filter(Boolean) };
      const entryId = await EntryFactory.create(velden);
      const { url, path } = await ScanStorageFactory.upload(item.file, entryId);
      await EntryFactory.update(entryId, { scanUrl: url, scanPath: path });

      update({ status: 'klaar', entryId, naam: data.naam || item.file.name });
    } catch (err) {
      update({ status: 'fout', error: err.message || 'Onbekende fout' });
    }
  };

  const startVerwerking = async () => {
    setBezig(true);
    const wachtrij = items.filter((it) => it.status === 'wachtend' || it.status === 'fout');

    let index = 0;
    const werkers = Array.from({ length: CONCURRENCY }, async () => {
      while (index < wachtrij.length) {
        const item = wachtrij[index];
        index += 1;
        await verwerkItem(item);
      }
    });
    await Promise.all(werkers);
    setBezig(false);
  };

  const verwijderItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const retryItem = (id) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'wachtend', error: null } : it)));
  };

  const klaarCount = items.filter((it) => it.status === 'klaar').length;
  const foutCount = items.filter((it) => it.status === 'fout').length;
  const alleGedaan = items.length > 0 && items.every((it) => it.status === 'klaar' || it.status === 'fout');

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Meerdere scans uploaden — Beheer</title>
      </Head>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 20px 80px' }}>
        <a href="/beheer" style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textDecoration: 'none' }}>
          ← Terug naar overzicht
        </a>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '12px 0 6px' }}>
          Meerdere scans uploaden
        </h1>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 28 }}>
          Kies al je scans in één keer. Elke scan wordt herkend en als concept
          opgeslagen — nakijken en publiceren doe je nadien per formulier
          via het overzicht.
        </p>

        {items.length === 0 && (
          <label
            style={{
              display: 'block',
              border: `1.5px dashed ${colors.line}`,
              borderRadius: radius.card,
              padding: 32,
              textAlign: 'center',
              background: colors.paperCard,
              cursor: 'pointer',
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.inkMuted,
            }}
          >
            Klik om meerdere scans te kiezen (foto's of pdf's)
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFiles}
              style={{ display: 'none' }}
            />
          </label>
        )}

        {items.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
                {items.length} scans gekozen
                {(klaarCount > 0 || foutCount > 0) && ` · ${klaarCount} klaar${foutCount ? `, ${foutCount} mislukt` : ''}`}
              </div>
              {!alleGedaan && (
                <button onClick={startVerwerking} disabled={bezig} style={mainBtn(bezig)}>
                  {bezig ? 'Bezig met verwerken…' : 'Start verwerking'}
                </button>
              )}
              {alleGedaan && (
                <Link
                  href="/beheer"
                  style={{ ...mainBtn(false), textDecoration: 'none', display: 'inline-block' }}
                >
                  Naar overzicht →
                </Link>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: colors.paperCard,
                    border: `1px solid ${colors.line}`,
                    borderRadius: radius.card,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.ink, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.naam || item.file.name}
                    </div>
                    {item.error && (
                      <div style={{ fontFamily: fonts.body, fontSize: 11, color: colors.stamp, marginTop: 2 }}>
                        {item.error}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 12,
                        fontWeight: 600,
                        color: STATUS_COLOR[item.status],
                      }}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                    {item.status === 'klaar' && item.entryId && (
                      <Link href={`/beheer/${item.entryId}`} style={smallLink}>
                        Bekijken
                      </Link>
                    )}
                    {item.status === 'fout' && (
                      <button onClick={() => retryItem(item.id)} style={smallBtn(colors.forest)}>
                        Opnieuw
                      </button>
                    )}
                    {item.status === 'wachtend' && (
                      <button onClick={() => verwijderItem(item.id)} style={smallBtn(colors.stamp)}>
                        Verwijderen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function mainBtn(disabled) {
  return {
    padding: '10px 20px',
    borderRadius: 999,
    border: 'none',
    background: disabled ? colors.inkMuted : colors.forest,
    color: colors.white,
    fontFamily: fonts.body,
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? 'default' : 'pointer',
  };
}

const smallLink = {
  fontFamily: fonts.body,
  fontSize: 12,
  fontWeight: 600,
  color: colors.forest,
  textDecoration: 'none',
};

function smallBtn(color) {
  return {
    padding: '5px 12px',
    borderRadius: 999,
    border: 'none',
    background: color,
    color: '#FFF',
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  };
}
