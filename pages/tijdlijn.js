import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory, KentekenFactory, MijlpaalFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import { parsePeriodRange, werkingsjaarLabel } from '../lib/utils';
import PublicNav from '../components/PublicNav';

const NAAM_KOLOM = 130;
const PX_PER_JAAR = 22;
const STARTJAAR = 1944;

export default function TijdlijnPage() {
  const [rijen, setRijen] = useState([]);
  const [zonderJaar, setZonderJaar] = useState([]);
  const [kentekens, setKentekens] = useState([]);
  const [mijlpalen, setMijlpalen] = useState([]);
  const [geselecteerdeMijlpaal, setGeselecteerdeMijlpaal] = useState(null);
  const [geselecteerdKenteken, setGeselecteerdKenteken] = useState(null);
  const [loading, setLoading] = useState(true);

  const eindJaar = new Date().getFullYear();
  const totaalJaren = eindJaar - STARTJAAR + 1;
  const breedteJaren = totaalJaren * PX_PER_JAAR;
  const totaleBreedte = NAAM_KOLOM + breedteJaren;

  // Twee gesynchroniseerde scroll-boxen (boven: as/kentekens/mijlpalen,
  // onder: leden) zodat het mijlpaal/kenteken-detail daartussen kan staan
  // in plaats van helemaal onderaan, na alle leden.
  const scrollTopRef = useRef(null);
  const scrollBottomRef = useRef(null);
  const syncBezig = useRef(false);
  const [sliderPercent, setSliderPercent] = useState(0);

  useEffect(() => {
    Promise.all([EntryFactory.getPublished(), KentekenFactory.getAll(), MijlpaalFactory.getPublished()]).then(
      ([entries, kentekenLijst, mijlpaalLijst]) => {
        const metJaar = [];
        const geen = [];
        entries.forEach((e) => {
          const { start, end } = parsePeriodRange(e.periode);
          if (start) metJaar.push({ ...e, start, end });
          else geen.push(e);
        });
        setRijen([...metJaar].sort((a, b) => a.start - b.start || a.naam.localeCompare(b.naam)));
        setZonderJaar(geen);
        setKentekens(kentekenLijst.filter((k) => k.afbeeldingUrl || k.jaarleuze));
        setMijlpalen(mijlpaalLijst);
        setLoading(false);
      }
    );
  }, []);

  const pixelFor = (jaar) => NAAM_KOLOM + (jaar - STARTJAAR) * PX_PER_JAAR;

  const tickJaren = () => {
    const ticks = [];
    for (let j = STARTJAAR; j <= eindJaar; j += 5) ticks.push(j);
    if (ticks[ticks.length - 1] !== eindJaar) ticks.push(eindJaar);
    return ticks;
  };

  const syncNaar = (bron, doel) => {
    if (!bron || !doel) return;
    const max = bron.scrollWidth - bron.clientWidth;
    doel.scrollLeft = bron.scrollLeft;
    setSliderPercent(max > 0 ? (bron.scrollLeft / max) * 100 : 0);
  };

  const handleScrollTop = () => {
    if (syncBezig.current) return;
    syncBezig.current = true;
    syncNaar(scrollTopRef.current, scrollBottomRef.current);
    syncBezig.current = false;
  };

  const handleScrollBottom = () => {
    if (syncBezig.current) return;
    syncBezig.current = true;
    syncNaar(scrollBottomRef.current, scrollTopRef.current);
    syncBezig.current = false;
  };

  const handleSliderChange = (e) => {
    const percent = Number(e.target.value);
    setSliderPercent(percent);
    [scrollTopRef.current, scrollBottomRef.current].forEach((el) => {
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      el.scrollLeft = (percent / 100) * max;
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Tijdlijn — Vrienden van Sint-Eduardusscouts</title>
      </Head>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 16px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Doorheen de jaren
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted, margin: 0 }}>
            Leden, jaarkentekens en mijlpalen sinds {STARTJAAR}
          </p>
          <Link
            href="/mijlpaal-toevoegen"
            style={{
              display: 'inline-block',
              marginTop: 10,
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: 600,
              color: colors.forest,
              textDecoration: 'none',
            }}
          >
            🚩 Ken jij nog een belangrijke mijlpaal? Stel ze voor →
          </Link>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
        )}

        {!loading && (
          <>
            {/* Custom jaren-slider */}
            <div style={{ padding: '0 4px', marginBottom: 12 }}>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={sliderPercent}
                onChange={handleSliderChange}
                className="vb-jaarslider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, marginTop: 2 }}>
                <span>{STARTJAAR}</span>
                <span>← sleep om door de jaren te bladeren →</span>
                <span>{eindJaar}</span>
              </div>
            </div>

            {/* Box 1: jaartallen-as, kentekens, mijlpalen */}
            <div
              ref={scrollTopRef}
              onScroll={handleScrollTop}
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                background: colors.paperCard,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.card,
                padding: '16px 0',
              }}
            >
              <div style={{ width: totaleBreedte }}>
                {/* Jaartallen-as */}
                <div style={{ position: 'relative', height: 20, marginBottom: 10 }}>
                  {tickJaren().map((jaar) => (
                    <div
                      key={jaar}
                      style={{
                        position: 'absolute',
                        left: pixelFor(jaar),
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

                {/* Jaarkentekens */}
                {kentekens.length > 0 && (
                  <div style={{ position: 'relative', height: 56, marginBottom: 8 }}>
                    <RijLabel>🧭 Kentekens</RijLabel>
                    {kentekens.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => setGeselecteerdKenteken(k)}
                        title={`${werkingsjaarLabel(k.startJaar)}${k.jaarleuze ? ': ' + k.jaarleuze : ''}`}
                        style={{
                          position: 'absolute',
                          left: pixelFor(k.startJaar),
                          top: 4,
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: `2px solid ${colors.campfire}`,
                          background: colors.white,
                          padding: 0,
                          cursor: 'pointer',
                        }}
                      >
                        {k.afbeeldingUrl && (
                          <img src={k.afbeeldingUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mijlpalen */}
                {mijlpalen.length > 0 && (
                  <div style={{ position: 'relative', height: 34 }}>
                    <RijLabel>🚩 Mijlpalen</RijLabel>
                    {mijlpalen.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setGeselecteerdeMijlpaal(m)}
                        title={m.titel}
                        style={{
                          position: 'absolute',
                          left: pixelFor(m.jaar),
                          top: 0,
                          transform: 'translateX(-50%)',
                          background: 'none',
                          border: 'none',
                          fontSize: 20,
                          cursor: 'pointer',
                          lineHeight: 1,
                          padding: 2,
                        }}
                      >
                        🚩
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail: geselecteerd kenteken of mijlpaal — tussen de twee boxen, altijd meteen zichtbaar */}
            {geselecteerdKenteken && (
              <div
                style={{
                  marginTop: 12,
                  background: colors.paperCard,
                  border: `1.5px solid ${colors.campfire}`,
                  borderRadius: radius.card,
                  padding: '20px 22px',
                  display: 'flex',
                  gap: 18,
                  alignItems: 'center',
                }}
              >
                {geselecteerdKenteken.afbeeldingUrl && (
                  <img
                    src={geselecteerdKenteken.afbeeldingUrl}
                    alt=""
                    style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.campfire}`, flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.ink }}>
                    {werkingsjaarLabel(geselecteerdKenteken.startJaar)}
                  </div>
                  {geselecteerdKenteken.jaarleuze && (
                    <p style={{ fontFamily: fonts.display, fontSize: 17, fontStyle: 'italic', color: colors.forest, marginTop: 6 }}>
                      “{geselecteerdKenteken.jaarleuze}”
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setGeselecteerdKenteken(null)}
                  style={{ background: 'none', border: 'none', fontSize: 18, color: colors.inkMuted, cursor: 'pointer' }}
                  aria-label="Sluiten"
                >
                  ✕
                </button>
              </div>
            )}

            {geselecteerdeMijlpaal && (
              <div
                style={{
                  marginTop: 12,
                  background: colors.paperCard,
                  border: `1.5px solid ${colors.campfire}`,
                  borderRadius: radius.card,
                  padding: '20px 22px',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                {geselecteerdeMijlpaal.afbeeldingUrl && (
                  <img
                    src={geselecteerdeMijlpaal.afbeeldingUrl}
                    alt=""
                    style={{ width: 80, height: 80, borderRadius: radius.card, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 700, color: colors.ink }}>
                    {geselecteerdeMijlpaal.jaar} — {geselecteerdeMijlpaal.titel}
                  </div>
                  {geselecteerdeMijlpaal.beschrijving && (
                    <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, marginTop: 6, lineHeight: 1.5 }}>
                      {geselecteerdeMijlpaal.beschrijving}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setGeselecteerdeMijlpaal(null)}
                  style={{ background: 'none', border: 'none', fontSize: 18, color: colors.inkMuted, cursor: 'pointer' }}
                  aria-label="Sluiten"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Box 2: leden */}
            <div
              ref={scrollBottomRef}
              onScroll={handleScrollBottom}
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                background: colors.paperCard,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.card,
                padding: '14px 0',
                marginTop: 12,
              }}
            >
              <div style={{ width: totaleBreedte, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rijen.map((entry) => {
                  const linksPx = pixelFor(entry.start);
                  const heeftEind = entry.end != null;
                  const breedtePx = heeftEind ? Math.max(pixelFor(entry.end) - linksPx, 8) : null;

                  return (
                    <Link key={entry.id} href={`/entry/${entry.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ position: 'relative', height: 24 }}>
                        <div
                          style={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            width: NAAM_KOLOM,
                            background: colors.paperCard,
                            fontFamily: fonts.display,
                            fontSize: 13,
                            fontWeight: 600,
                            color: colors.ink,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={entry.naam}
                        >
                          {entry.naam}
                        </div>

                        {heeftEind ? (
                          <div
                            style={{
                              position: 'absolute',
                              left: linksPx,
                              width: breedtePx,
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
                              left: linksPx,
                              top: 2,
                              height: 20,
                              minWidth: 36,
                              padding: '0 6px',
                              background: colors.campfireLight,
                              border: `1.5px dashed ${colors.campfire}`,
                              borderRadius: radius.input,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: colors.campfire }}>
                              ⋯?
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <style jsx>{`
              .vb-jaarslider {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 10px;
                border-radius: 999px;
                background: linear-gradient(90deg, ${colors.forest}, ${colors.campfire});
                outline: none;
                cursor: pointer;
              }
              .vb-jaarslider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: ${colors.paperCard};
                border: 3px solid ${colors.campfire};
                box-shadow: 0 1px 4px rgba(44, 36, 25, 0.3);
                cursor: pointer;
              }
              .vb-jaarslider::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: ${colors.paperCard};
                border: 3px solid ${colors.campfire};
                cursor: pointer;
              }
            `}</style>
          </>
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

function RijLabel({ children }) {
  return (
    <div
      style={{
        position: 'sticky',
        left: 0,
        zIndex: 2,
        width: NAAM_KOLOM,
        background: colors.paperCard,
        fontFamily: fonts.body,
        fontSize: 12,
        fontWeight: 700,
        color: colors.inkMuted,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}
