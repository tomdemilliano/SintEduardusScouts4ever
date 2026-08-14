import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import { parsePeriodRange } from '../lib/utils';
import PublicNav from '../components/PublicNav';

const NAAM_KOLOM = 130;
const JAAR_KOLOM = 96;

export default function TijdlijnPage() {
  const [rijen, setRijen] = useState([]);
  const [zonderJaar, setZonderJaar] = useState([]);
  const [bereik, setBereik] = useState(null); // { min, max }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EntryFactory.getPublished().then((entries) => {
      const metJaar = [];
      const geen = [];
      entries.forEach((e) => {
        const { start, end } = parsePeriodRange(e.periode);
        if (start) metJaar.push({ ...e, start, end });
        else geen.push(e);
      });

      if (metJaar.length > 0) {
        const alleJaren = metJaar.flatMap((e) => [e.start, e.end || e.start]);
        const min = Math.min(...alleJaren);
        const max = Math.max(...alleJaren);
        const gesorteerd = [...metJaar].sort(
          (a, b) => a.start - b.start || a.naam.localeCompare(b.naam)
        );
        setRijen(gesorteerd);
        setBereik({ min, max: Math.max(max, min + 1) }); // vermijd deling door 0
      }

      setZonderJaar(geen);
      setLoading(false);
    });
  }, []);

  const percent = (jaar) => {
    if (!bereik) return 0;
    return ((jaar - bereik.min) / (bereik.max - bereik.min)) * 100;
  };

  const tickJaren = () => {
    if (!bereik) return [];
    const span = bereik.max - bereik.min;
    const stap = span <= 12 ? 2 : span <= 30 ? 5 : 10;
    const ticks = [];
    for (let j = bereik.min; j <= bereik.max; j += stap) ticks.push(j);
    if (ticks[ticks.length - 1] !== bereik.max) ticks.push(bereik.max);
    return ticks;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Tijdlijn — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 36px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Doorheen de jaren
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted }}>
            Ieders ledenperiode, van start- tot eindjaar
          </p>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
        )}

        {!loading && bereik && (
          <div
            style={{
              background: colors.paperCard,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.card,
              padding: '20px 20px 8px',
            }}
          >
            {/* Jaartallen-as */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ width: NAAM_KOLOM, flexShrink: 0 }} />
              <div style={{ flex: 1, position: 'relative', height: 16 }}>
                {tickJaren().map((jaar) => (
                  <div
                    key={jaar}
                    style={{
                      position: 'absolute',
                      left: `${percent(jaar)}%`,
                      transform: 'translateX(-50%)',
                      fontFamily: fonts.body,
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.inkMuted,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {jaar}
                  </div>
                ))}
              </div>
              <div style={{ width: JAAR_KOLOM, flexShrink: 0 }} />
            </div>

            {/* Rijen */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rijen.map((entry) => {
                const linksPercent = percent(entry.start);
                const heeftEind = entry.end != null;
                const breedtePercent = heeftEind
                  ? Math.max(percent(entry.end) - linksPercent, 3)
                  : null;

                return (
                  <Link
                    key={entry.id}
                    href={`/entry/${entry.id}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 0',
                        borderRadius: radius.input,
                      }}
                    >
                      <div
                        style={{
                          width: NAAM_KOLOM,
                          flexShrink: 0,
                          fontFamily: fonts.display,
                          fontSize: 14,
                          fontWeight: 600,
                          color: colors.ink,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          paddingRight: 8,
                        }}
                        title={entry.naam}
                      >
                        {entry.naam}
                      </div>

                      <div style={{ flex: 1, position: 'relative', height: 24 }}>
                        {/* subtiele achtergrondlijn voor het volledige jaarbereik */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '50%',
                            height: 1,
                            background: colors.line,
                          }}
                        />
                        {heeftEind ? (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${linksPercent}%`,
                              width: `${breedtePercent}%`,
                              top: 3,
                              height: 18,
                              background: colors.forest,
                              borderRadius: radius.input,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${linksPercent}%`,
                              top: 2,
                              height: 20,
                              minWidth: 40,
                              padding: '0 6px',
                              background: colors.campfireLight,
                              border: `1.5px dashed ${colors.campfire}`,
                              borderRadius: radius.input,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: colors.campfire, whiteSpace: 'nowrap' }}>
                              ⋯?
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          width: JAAR_KOLOM,
                          flexShrink: 0,
                          fontFamily: fonts.body,
                          fontSize: 12,
                          color: colors.inkMuted,
                          textAlign: 'right',
                        }}
                      >
                        {entry.start}
                        {heeftEind ? ` – ${entry.end}` : ' – ⋯?'}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {zonderJaar.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.inkMuted,
                marginBottom: 10,
              }}
            >
              Periode niet gekend
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {zonderJaar.map((entry) => (
                <Link key={entry.id} href={`/entry/${entry.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: colors.paperCard,
                      border: `1px solid ${colors.line}`,
                      borderRadius: radius.card,
                      padding: '12px 16px',
                      fontFamily: fonts.display,
                      fontSize: 17,
                      fontWeight: 600,
                      color: colors.ink,
                    }}
                  >
                    {entry.naam}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
