import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';

export default function HomePage({ }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState('');

  useEffect(() => {
    EntryFactory.getPublished().then((e) => {
      setEntries(e);
      setLoading(false);
    });
  }, []);

  const gefilterd = entries.filter((e) =>
    `${e.naam} ${e.totemnaam}`.toLowerCase().includes(zoek.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: colors.paper }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Vriendenboekje — Oud-scouts reünie</title>
      </Head>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 20px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-block',
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: colors.campfire,
              marginBottom: 10,
            }}
          >
            Reünie oud-scouts
          </div>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 48,
              fontWeight: 700,
              color: colors.ink,
              margin: '0 0 10px',
            }}
          >
            Het Vriendenboekje
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 16, color: colors.inkMuted, maxWidth: 480, margin: '0 auto' }}>
            Herinneringen, totemnamen en de beste kampverhalen van iedereen die meedeed.
          </p>
        </div>

        <input
          type="text"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek op naam of totemnaam…"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: 360,
            margin: '0 auto 36px',
            padding: '10px 14px',
            borderRadius: radius.badge,
            border: `1px solid ${colors.line}`,
            background: colors.white,
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.ink,
            boxSizing: 'border-box',
          }}
        />

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
            Bezig met laden…
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 18,
          }}
        >
          {gefilterd.map((entry) => (
            <Link
              key={entry.id}
              href={`/entry/${entry.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  position: 'relative',
                  background: colors.paperCard,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.card,
                  padding: '22px 20px',
                  height: '100%',
                  boxSizing: 'border-box',
                  transition: 'transform 0.15s ease',
                }}
              >
                {entry.geboortejaar && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      fontFamily: fonts.body,
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.inkMuted,
                      border: `1px solid ${colors.line}`,
                      borderRadius: radius.badge,
                      padding: '3px 8px',
                    }}
                  >
                    °{entry.geboortejaar}
                  </div>
                )}
                <div style={{ fontFamily: fonts.display, fontSize: 21, fontWeight: 600, color: colors.ink, marginBottom: 6, paddingRight: 40 }}>
                  {entry.naam}
                </div>
                {entry.totemnaam && (
                  <div
                    style={{
                      display: 'inline-block',
                      fontFamily: fonts.body,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: colors.stamp,
                      border: `1.5px solid ${colors.stamp}`,
                      borderRadius: radius.badge,
                      padding: '3px 10px',
                      marginBottom: 10,
                      transform: 'rotate(-2deg)',
                    }}
                  >
                    {entry.totemnaam}
                  </div>
                )}
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
                  {entry.periode}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!loading && gefilterd.length === 0 && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
            Geen resultaten gevonden.
          </p>
        )}
      </div>
    </div>
  );
}
