import { useState } from 'react';
import Head from 'next/head';
import { PhotoFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import { resizeImageFile } from '../../../lib/utils';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/fotos', label: 'Overzicht', exact: true },
  { href: '/beheer/fotos/toevoegen', label: "+ Foto's toevoegen" },
  { href: '/beheer/fotos/tags', label: 'Tags' },
];

const STATUS_LABEL = {
  wachtend: 'Wachtend…',
  verkleinen: 'Bezig met verkleinen…',
  uploaden: 'Bezig met opladen…',
  klaar: 'Klaar',
  fout: 'Mislukt',
};

export default function FotosToevoegenPage() {
  return (
    <RequireAuth>
      <FotosToevoegenContent />
    </RequireAuth>
  );
}

function FotosToevoegenContent() {
  const [bestanden, setBestanden] = useState([]);
  const [jaar, setJaar] = useState('');
  const [locatie, setLocatie] = useState('');
  const [bezig, setBezig] = useState(false);
  const [resultaat, setResultaat] = useState(null);
  const [fout, setFout] = useState(null);

  const handleBestanden = (e) => {
    const gekozen = Array.from(e.target.files || []);
    setBestanden(gekozen.map((file, i) => ({ id: `${Date.now()}-${i}`, file, status: 'wachtend' })));
    setResultaat(null);
  };

  const handleToevoegen = async () => {
    setFout(null);
    setResultaat(null);
    if (bestanden.length === 0) {
      setFout('Kies minstens één foto.');
      return;
    }
    setBezig(true);
    try {
      const updateStatus = (i, status) =>
        setBestanden((prev) => prev.map((b, idx) => (idx === i ? { ...b, status } : b)));

      const verkleind = [];
      for (let i = 0; i < bestanden.length; i++) {
        updateStatus(i, 'verkleinen');
        verkleind.push(await resizeImageFile(bestanden[i].file));
      }

      const aantal = await PhotoFactory.createBulkByAdmin(
        verkleind,
        { jaar: jaar ? parseInt(jaar, 10) : null, locatie: locatie.trim() },
        (i, status) => updateStatus(i, status === 'bezig' ? 'uploaden' : status)
      );
      setResultaat(aantal);
      setBestanden([]);
    } catch (err) {
      setFout('Opslaan mislukt, probeer opnieuw.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Foto's toevoegen — Beheer</title>
      </Head>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Foto's
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Foto's in bulk toevoegen
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 20 }}>
          Kies zoveel foto's als je wil — ze worden automatisch verkleind en
          meteen gepubliceerd. Jaar/locatie hieronder zijn optioneel en
          gelden dan voor de hele selectie; wie erop staat tag je nadien per
          foto, door jezelf of door bezoekers.
        </p>

        <div style={{ background: colors.paperCard, border: `1px solid ${colors.line}`, borderRadius: radius.card, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Foto's</label>
            <label
              style={{
                display: 'block',
                border: `1.5px dashed ${colors.line}`,
                borderRadius: radius.card,
                padding: 24,
                textAlign: 'center',
                cursor: 'pointer',
                fontFamily: fonts.body,
                fontSize: 13,
                color: colors.inkMuted,
              }}
            >
              {bestanden.length === 0
                ? "Klik om één of meerdere foto's te kiezen"
                : `${bestanden.length} foto${bestanden.length === 1 ? '' : "'s"} gekozen`}
              <input type="file" accept="image/*" multiple onChange={handleBestanden} style={{ display: 'none' }} />
            </label>

            {bestanden.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10, maxHeight: 200, overflowY: 'auto' }}>
                {bestanden.map((b) => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.body, fontSize: 12 }}>
                    <span style={{ color: colors.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.file.name}
                    </span>
                    <span style={{ color: b.status === 'fout' ? colors.stamp : b.status === 'klaar' ? colors.forest : colors.campfire, fontWeight: 600 }}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Jaar (optioneel, voor de hele selectie)</label>
              <input type="number" value={jaar} onChange={(e) => setJaar(e.target.value)} placeholder="bv. 1978" style={{ ...inputStyle, width: 130 }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Locatie (optioneel, voor de hele selectie)</label>
              <input type="text" value={locatie} onChange={(e) => setLocatie(e.target.value)} placeholder="bv. Falmignoul (Walzin)" style={inputStyle} />
            </div>
          </div>

          {fout && <div style={{ color: colors.stamp, fontFamily: fonts.body, fontSize: 13 }}>{fout}</div>}
          {resultaat != null && (
            <div style={{ color: colors.forest, fontFamily: fonts.body, fontSize: 13, fontWeight: 600 }}>
              ✓ {resultaat} foto{resultaat === 1 ? '' : "'s"} toegevoegd en gepubliceerd.
            </div>
          )}

          <button onClick={handleToevoegen} disabled={bezig} style={btn(colors.forest)}>
            {bezig ? 'Bezig…' : '+ Foto\'s toevoegen'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: radius.input,
  border: `1px solid ${colors.line}`,
  background: colors.white,
  fontFamily: fonts.body,
  fontSize: 14,
  color: colors.ink,
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontFamily: fonts.body,
  fontSize: 11,
  fontWeight: 600,
  color: colors.inkMuted,
  marginBottom: 3,
};

function btn(color) {
  return {
    alignSelf: 'flex-start',
    padding: '10px 20px',
    borderRadius: 999,
    border: 'none',
    background: color,
    color: '#FFF',
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
}
