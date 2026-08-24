import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory, PhotoFactory, LeidingFactory, TakFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import { toDishArray, werkingsjaarLabel } from '../../lib/utils';

export default function EntryDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [entry, setEntry] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [leidingJaren, setLeidingJaren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toonScan, setToonScan] = useState(false);
  const [ledenVolgorde, setLedenVolgorde] = useState([]);

  useEffect(() => {
    // De volgorde die de bezoeker op /vriendenboekje zag (met eventuele
    // zoekfilter), zodat vorige/volgende hier diezelfde volgorde volgt.
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('vb-leden-volgorde');
      if (raw) setLedenVolgorde(JSON.parse(raw));
    } catch (e) {
      setLedenVolgorde([]);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    EntryFactory.getById(id).then((e) => {
      const geldig = e && (e.status === 'published' || e.status === 'stub');
      setEntry(geldig ? e : null);
      setLoading(false);
      if (geldig) {
        PhotoFactory.getByEntryId(id).then(setFotos);
        Promise.all([LeidingFactory.getByEntryId(id), TakFactory.getAll()]).then(([leidingData, takken]) => {
          const lijst = leidingData
            .map((item) => ({
              werkingsjaarStart: item.werkingsjaarStart,
              takNaam: takken.find((t) => t.id === item.takId)?.naam || '(onbekende tak)',
            }))
            .sort((a, b) => b.werkingsjaarStart - a.werkingsjaarStart);
          setLeidingJaren(lijst);
        });
      }
    });
  }, [id]);

  const huidigeIndex = ledenVolgorde.findIndex((e) => e.id === id);
  const vorigeLid = huidigeIndex > 0 ? ledenVolgorde[huidigeIndex - 1] : null;
  const volgendeLid = huidigeIndex >= 0 && huidigeIndex < ledenVolgorde.length - 1 ? ledenVolgorde[huidigeIndex + 1] : null;

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
        <Link href="/vriendenboekje" style={{ fontFamily: fonts.body, color: colors.forest }}>
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
        <Link href="/vriendenboekje" style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textDecoration: 'none' }}>
          ← Terug naar het vriendenboekje
        </Link>

        {(vorigeLid || volgendeLid) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
            {vorigeLid ? (
              <Link
                href={`/entry/${vorigeLid.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: radius.badge,
                  border: `1px solid ${colors.line}`,
                  background: colors.paperCard,
                  color: colors.ink,
                  fontFamily: fonts.body,
                  fontSize: 13,
                  textDecoration: 'none',
                  maxWidth: '48%',
                }}
              >
                <span style={{ flexShrink: 0 }}>‹</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vorigeLid.naam}</span>
              </Link>
            ) : (
              <span />
            )}
            {volgendeLid ? (
              <Link
                href={`/entry/${volgendeLid.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: radius.badge,
                  border: `1px solid ${colors.line}`,
                  background: colors.paperCard,
                  color: colors.ink,
                  fontFamily: fonts.body,
                  fontSize: 13,
                  textDecoration: 'none',
                  maxWidth: '48%',
                  marginLeft: 'auto',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{volgendeLid.naam}</span>
                <span style={{ flexShrink: 0 }}>›</span>
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}

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
              {(entry.geboortejaar || entry.periode) && (
                <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, margin: '6px 0 0' }}>
                  {entry.geboortejaar && `°${entry.geboortejaar} · `}
                  {entry.periode && `Lid van ${entry.periode}`}
                </p>
              )}
              {entry.status === 'stub' && (
                <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.campfire, margin: '6px 0 0' }}>
                  Nog geen eigen vriendenboekje-fiche —{' '}
                  <Link href="/toevoegen" style={{ color: colors.campfire, fontWeight: 600 }}>
                    ben jij dit, of ken je deze persoon? Vul 'm zelf aan
                  </Link>
                  .
                </p>
              )}
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

            {leidingJaren.length > 0 && (
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
                  👥 Leiding
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {leidingJaren.map((item, i) => (
                    <div key={i} style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>
                      <span style={{ fontWeight: 600 }}>{item.takNaam}</span>
                      {' — '}
                      {werkingsjaarLabel(item.werkingsjaarStart)}
                    </div>
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

          {fotos.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: colors.forest,
                  marginBottom: 10,
                }}
              >
                📷 Foto's met {entry.naam.split(' ')[0]} ({fotos.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                {fotos.map((foto) => (
                  <Link key={foto.id} href={`/fotos/${foto.id}`} style={{ display: 'block' }}>
                    <img
                      src={foto.afbeeldingUrl}
                      alt=""
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: radius.input, border: `1px solid ${colors.line}` }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
