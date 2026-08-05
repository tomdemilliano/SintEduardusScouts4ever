import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import RequireAuth from '../../components/RequireAuth';

export default function BeheerPage() {
  return (
    <RequireAuth>
      <BeheerContent />
    </RequireAuth>
  );
}

function BeheerContent() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const all = await EntryFactory.getAll();
    setEntries(all);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePublish = async (id) => {
    await EntryFactory.publish(id);
    load();
  };

  const handleUnpublish = async (id) => {
    await EntryFactory.unpublish(id);
    load();
  };

  const handleDelete = async (entry) => {
    if (!confirm(`"${entry.naam}" definitief verwijderen?`)) return;
    await EntryFactory.remove(entry.id, entry.scanPath);
    load();
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.paper }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Beheer — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: 0 }}>
              Beheer
            </h1>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, margin: '6px 0 0' }}>
              {entries.length} formulier{entries.length === 1 ? '' : 'en'} ·{' '}
              {entries.filter((e) => e.status === 'published').length} gepubliceerd
            </p>
          </div>
          <Link
            href="/beheer/upload"
            style={{
              padding: '10px 20px',
              borderRadius: radius.badge,
              background: colors.campfire,
              color: colors.white,
              fontFamily: fonts.body,
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            + Nieuwe scan
          </Link>
        </div>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 18px',
                background: colors.paperCard,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.card,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 600, color: colors.ink }}>
                  {entry.naam || '(naamloos)'}{' '}
                  <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 400, color: colors.inkMuted }}>
                    {entry.totemnaam && `— ${entry.totemnaam}`}
                  </span>
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
                  {entry.periode || 'periode onbekend'} ·{' '}
                  <span style={{ color: entry.status === 'published' ? colors.forest : colors.campfire, fontWeight: 600 }}>
                    {entry.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link
                  href={`/beheer/${entry.id}`}
                  style={{
                    padding: '7px 14px',
                    borderRadius: radius.badge,
                    border: `1px solid ${colors.line}`,
                    color: colors.ink,
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Bewerken
                </Link>
                {entry.status === 'published' ? (
                  <button
                    onClick={() => handleUnpublish(entry.id)}
                    style={btnStyle(colors.inkMuted)}
                  >
                    Depubliceren
                  </button>
                ) : (
                  <button onClick={() => handlePublish(entry.id)} style={btnStyle(colors.forest)}>
                    Publiceren
                  </button>
                )}
                <button onClick={() => handleDelete(entry)} style={btnStyle(colors.stamp)}>
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && entries.length === 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>
            Nog geen formulieren toegevoegd. Klik op "+ Nieuwe scan" om te starten.
          </p>
        )}
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    padding: '7px 14px',
    borderRadius: 999,
    border: 'none',
    background: color,
    color: '#FFF',
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };
}
