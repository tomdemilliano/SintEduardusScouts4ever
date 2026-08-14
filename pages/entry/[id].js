import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import { toDishArray } from '../../lib/utils';

export default function EntryDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toonScan, setToonScan] = useState(false);

  useEffect(() => {
    if (!id) return;
    EntryFactory.getById(id).then((e) => {
      setEntry(e && e.status === 'published' ? e : null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', padding: 48 }}>
        <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', padding: 48, textAlign: 'center' }}>
        <p style={{ fontFamily: fonts.body, color: colors.stamp, marginBottom: 12 }}>
          Dit formulier bestaat niet (meer) of is nog niet gepubliceerd.
        </p>
        <Link href="/" style={{ fontFamily: fonts.body, color: colors.forest }}>
          ← Terug naar het vriendenboekje
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>{entry.naam} — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 100px' }}>
        <Link href="/" style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textDecoration: 'none' }}>
          ← Terug naar het vriendenboekje
        </Link>

        <div
          style={{
            background: colors.paperCard,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.card,
            padding: '36px 32px',
            marginTop: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h1 style={{ fontFamily: fonts.display, fontSize: 34, fontWeight: 700, color: colors.ink, margin: 0 }}>
                {entry.naam}
              </h1>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, margin: '6px 0 0' }}>
                {entry.geboortejaar && `°${entry.geboortejaar} · `}
                Lid van {entry.periode || '—'}
              </p>
            </div>
            {entry.totemnaam && (
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: colors.stamp,
                  border: `1.5px solid ${colors.stamp}`,
                  borderRadius: radius.badge,
                  padding: '5px 14px',
                  transform: 'rotate(-2deg)',
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.totemnaam}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: colors.line, margin: '26px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {toDishArray(entry.leuksteActiviteit).filter(Boolean).length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: colors.forest,
                    marginBottom: 6,
                  }}
                >
                  Het plezantste spel of de strafste activiteit
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {toDishArray(entry.leuksteActiviteit)
                    .filter(Boolean)
                    .map((activiteit, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: fonts.display,
                          fontSize: 16,
                          fontWeight: 600,
                          color: colors.ink,
                          background: colors.white,
                          border: `1px solid ${colors.line}`,
                          borderRadius: radius.badge,
                          padding: '5px 14px',
                        }}
                      >
                        {activiteit}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {toDishArray(entry.besteKampplaats).filter(Boolean).length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: colors.forest,
                    marginBottom: 6,
                  }}
                >
                  De beste kampplaats ooit
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {toDishArray(entry.besteKampplaats)
                    .filter(Boolean)
                    .map((plaats, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: fonts.display,
                          fontSize: 16,
                          fontWeight: 600,
                          color: colors.ink,
                          background: colors.white,
                          border: `1px solid ${colors.line}`,
                          borderRadius: radius.badge,
                          padding: '5px 14px',
                        }}
                      >
                        {plaats}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {toDishArray(entry.lekkersteEten).filter(Boolean).length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: colors.forest,
                    marginBottom: 6,
                  }}
                >
                  Het lekkerste kamp-eten
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {toDishArray(entry.lekkersteEten)
                    .filter(Boolean)
                    .map((gerecht, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: fonts.display,
                          fontSize: 16,
                          fontWeight: 600,
                          color: colors.ink,
                          background: colors.campfireLight,
                          borderRadius: radius.badge,
                          padding: '5px 14px',
                        }}
                      >
                        {gerecht}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {entry.scanUrl && (
            <div style={{ marginTop: 30 }}>
              <button
                onClick={() => setToonScan((v) => !v)}
                style={{
                  padding: '8px 16px',
                  borderRadius: radius.badge,
                  border: `1px solid ${colors.line}`,
                  background: 'transparent',
                  color: colors.inkMuted,
                  fontFamily: fonts.body,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {toonScan ? 'Verberg origineel formulier' : 'Bekijk origineel formulier'}
              </button>
              {toonScan && (
                <img
                  src={entry.scanUrl}
                  alt={`Origineel formulier van ${entry.naam}`}
                  style={{ display: 'block', maxWidth: '100%', marginTop: 14, borderRadius: radius.card, border: `1px solid ${colors.line}` }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
