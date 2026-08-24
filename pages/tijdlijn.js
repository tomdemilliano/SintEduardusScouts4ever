import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory, KentekenFactory, MijlpaalFactory, TakFactory, LeidingFactory, ActivityFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import { parsePeriodRange, werkingsjaarLabel, huidigWerkingsjaarStart } from '../lib/utils';
import PublicNav from '../components/PublicNav';
import MemberTagPicker from '../components/MemberTagPicker';

const NAAM_KOLOM = 130;
const PX_PER_JAAR = 22;
const STARTJAAR = 1944;

export default function TijdlijnPage() {
  const [rijen, setRijen] = useState([]);
  const [zonderJaar, setZonderJaar] = useState([]);
  const [kentekens, setKentekens] = useState([]);
  const [mijlpalen, setMijlpalen] = useState([]);
  const [takken, setTakken] = useState([]);
  const [leidingLijst, setLeidingLijst] = useState([]);
  const [geselecteerdeMijlpaal, setGeselecteerdeMijlpaal] = useState(null);
  const [geselecteerdKenteken, setGeselecteerdKenteken] = useState(null);
  const [geselecteerdeLeiding, setGeselecteerdeLeiding] = useState(null); // { takId, werkingsjaarStart }
  const [leidingBewerkModus, setLeidingBewerkModus] = useState(false);
  const [leidingBewerkLeden, setLeidingBewerkLeden] = useState([]);
  const [leidingOpslaanBezig, setLeidingOpslaanBezig] = useState(false);
  const [toevoegFormOpen, setToevoegFormOpen] = useState(false);
  const [nieuwTakId, setNieuwTakId] = useState('');
  const [nieuwJaar, setNieuwJaar] = useState(String(huidigWerkingsjaarStart()));
  const [nieuwLeden, setNieuwLeden] = useState([]);
  const [nieuwOpslaanBezig, setNieuwOpslaanBezig] = useState(false);
  const [loading, setLoading] = useState(true);

  const eindJaar = new Date().getFullYear();
  const totaalJaren = eindJaar - STARTJAAR + 1;
  const breedteJaren = totaalJaren * PX_PER_JAAR;
  const totaleBreedte = NAAM_KOLOM + breedteJaren;

  // Drie gesynchroniseerde scroll-boxen (jaren-as/kentekens/mijlpalen,
  // leidingsploegen per tak, leden) zodat detailkaarten er telkens
  // tussenin kunnen staan i.p.v. helemaal onderaan.
  const scrollTopRef = useRef(null);
  const scrollLeidingRef = useRef(null);
  const scrollBottomRef = useRef(null);
  const syncBezig = useRef(false);
  const [sliderPercent, setSliderPercent] = useState(0);

  const load = () => {
    Promise.all([
      EntryFactory.getPublished(),
      KentekenFactory.getAll(),
      MijlpaalFactory.getPublished(),
      TakFactory.getAll(),
      LeidingFactory.getAll(),
    ]).then(([entries, kentekenLijst, mijlpaalLijst, takLijst, leidingData]) => {
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
      setTakken(takLijst);
      setLeidingLijst(leidingData.filter((l) => (l.leden || []).length > 0));
      if (!nieuwTakId && takLijst.length > 0) setNieuwTakId(takLijst[0].id);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pixelFor = (jaar) => NAAM_KOLOM + (jaar - STARTJAAR) * PX_PER_JAAR;

  // Rechtstreeks uit het schuifpercentage afgeleid (0% = STARTJAAR, 100% =
  // eindJaar) — dit garandeert dat je bij helemaal doorschuiven ook echt
  // het eindjaar te zien krijgt, in tegenstelling tot een berekening op
  // basis van scrollpositie (die afhangt van de kaderbreedte en dus nooit
  // helemaal tot het eindjaar kwam).
  const zichtbaarJaar = Math.round(STARTJAAR + (sliderPercent / 100) * (eindJaar - STARTJAAR));

  const mijlpalenScouting = mijlpalen.filter((m) => m.type === 'scouting');
  const mijlpalenGroep = mijlpalen.filter((m) => m.type !== 'scouting');

  const tickJaren = () => {
    const ticks = [];
    for (let j = STARTJAAR; j <= eindJaar; j += 5) ticks.push(j);
    if (ticks[ticks.length - 1] !== eindJaar) ticks.push(eindJaar);
    return ticks;
  };

  const syncNaar = (bron, doelen) => {
    if (!bron) return;
    const max = bron.scrollWidth - bron.clientWidth;
    doelen.forEach((doel) => {
      if (doel) doel.scrollLeft = bron.scrollLeft;
    });
    setSliderPercent(max > 0 ? (bron.scrollLeft / max) * 100 : 0);
  };

  const maakScrollHandler = (bronRef, doelRefs) => () => {
    if (syncBezig.current) return;
    syncBezig.current = true;
    syncNaar(bronRef.current, doelRefs.map((r) => r.current));
    syncBezig.current = false;
  };

  const handleScrollTop = maakScrollHandler(scrollTopRef, [scrollLeidingRef, scrollBottomRef]);
  const handleScrollLeiding = maakScrollHandler(scrollLeidingRef, [scrollTopRef, scrollBottomRef]);
  const handleScrollBottom = maakScrollHandler(scrollBottomRef, [scrollTopRef, scrollLeidingRef]);

  const handleSliderChange = (e) => {
    const percent = Number(e.target.value);
    setSliderPercent(percent);
    [scrollTopRef.current, scrollLeidingRef.current, scrollBottomRef.current].forEach((el) => {
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      el.scrollLeft = (percent / 100) * max;
    });
  };

  const openLeidingDetail = (takId, werkingsjaarStart) => {
    setGeselecteerdeLeiding({ takId, werkingsjaarStart });
    setLeidingBewerkModus(false);
  };

  const startLeidingBewerken = () => {
    const item = leidingLijst.find(
      (l) => l.takId === geselecteerdeLeiding.takId && l.werkingsjaarStart === geselecteerdeLeiding.werkingsjaarStart
    );
    setLeidingBewerkLeden(item?.leden || []);
    setLeidingBewerkModus(true);
  };

  const leidingOpslaan = async () => {
    setLeidingOpslaanBezig(true);
    try {
      await LeidingFactory.set(geselecteerdeLeiding.takId, geselecteerdeLeiding.werkingsjaarStart, leidingBewerkLeden);
      const takNaam = takken.find((t) => t.id === geselecteerdeLeiding.takId)?.naam || '(onbekende tak)';
      ActivityFactory.log({
        type: 'leiding',
        actie: 'Leidingsploeg bijgewerkt',
        itemId: `${geselecteerdeLeiding.takId}_${geselecteerdeLeiding.werkingsjaarStart}`,
        omschrijving: `${takNaam} ${werkingsjaarLabel(geselecteerdeLeiding.werkingsjaarStart)}`,
      });
      load();
      setLeidingBewerkModus(false);
    } finally {
      setLeidingOpslaanBezig(false);
    }
  };

  const nieuweLeidingOpslaan = async () => {
    const jaarNum = parseInt(nieuwJaar, 10);
    if (!nieuwTakId || !jaarNum) return;
    setNieuwOpslaanBezig(true);
    try {
      await LeidingFactory.set(nieuwTakId, jaarNum, nieuwLeden);
      const takNaam = takken.find((t) => t.id === nieuwTakId)?.naam || '(onbekende tak)';
      ActivityFactory.log({
        type: 'leiding',
        actie: 'Nieuwe leidingsploeg toegevoegd',
        itemId: `${nieuwTakId}_${jaarNum}`,
        omschrijving: `${takNaam} ${werkingsjaarLabel(jaarNum)}`,
      });
      load();
      setNieuwLeden([]);
      setToevoegFormOpen(false);
    } finally {
      setNieuwOpslaanBezig(false);
    }
  };

  const geselecteerdeLeidingItem = geselecteerdeLeiding
    ? leidingLijst.find(
        (l) => l.takId === geselecteerdeLeiding.takId && l.werkingsjaarStart === geselecteerdeLeiding.werkingsjaarStart
      )
    : null;
  const geselecteerdeLeidingTakNaam = geselecteerdeLeiding
    ? takken.find((t) => t.id === geselecteerdeLeiding.takId)?.naam || '(onbekende tak)'
    : '';

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
            Leden, jaarkentekens, leidingsploegen en mijlpalen sinds {STARTJAAR}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, marginTop: 4 }}>
                <span>{STARTJAAR}</span>
                <span style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 700, color: colors.campfire }}>
                  {zichtbaarJaar}
                </span>
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
              <div style={{ width: totaleBreedte, position: 'relative' }}>
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

                {/* Mijlpalen — scouting (bewegingsbreed) */}
                {mijlpalenScouting.length > 0 && (
                  <div style={{ position: 'relative', height: 34 }}>
                    <RijLabel>⚜️ Scouting</RijLabel>
                    {mijlpalenScouting.map((m) => (
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
                        ⚜️
                      </button>
                    ))}
                  </div>
                )}

                {/* Mijlpalen — eigen groep */}
                {mijlpalenGroep.length > 0 && (
                  <div style={{ position: 'relative', height: 34 }}>
                    <RijLabel>🚩 Onze groep</RijLabel>
                    {mijlpalenGroep.map((m) => (
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

                <Jaarlijn jaar={zichtbaarJaar} />
              </div>
            </div>

            {/* Detail: geselecteerd kenteken of mijlpaal */}
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
                  <div
                    style={{
                      display: 'inline-block',
                      fontFamily: fonts.body,
                      fontSize: 11,
                      fontWeight: 700,
                      color: geselecteerdeMijlpaal.type === 'scouting' ? colors.forestDark : colors.campfire,
                      background: geselecteerdeMijlpaal.type === 'scouting' ? colors.campfireLight : 'transparent',
                      border: geselecteerdeMijlpaal.type === 'scouting' ? 'none' : `1px solid ${colors.campfire}`,
                      borderRadius: radius.badge,
                      padding: '2px 10px',
                      marginBottom: 6,
                    }}
                  >
                    {geselecteerdeMijlpaal.type === 'scouting' ? '⚜️ Scouting-mijlpaal' : '🚩 Mijlpaal van onze groep'}
                  </div>
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

            {/* Apart vak: leidingsploegen per tak */}
            {takken.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  background: colors.paperCard,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.card,
                  padding: '14px 0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '0 16px 12px' }}>
                  <div style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 700, color: colors.ink }}>
                    Leidingsploegen per tak
                  </div>
                  <button
                    onClick={() => setToevoegFormOpen((v) => !v)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: radius.badge,
                      border: 'none',
                      background: colors.forest,
                      color: colors.white,
                      fontFamily: fonts.body,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {toevoegFormOpen ? 'Sluiten' : '+ Leidingsploeg toevoegen'}
                  </button>
                </div>

                {toevoegFormOpen && (
                  <div style={{ margin: '0 16px 14px', padding: '14px 16px', background: colors.campfireLight, border: `1.5px dashed ${colors.campfire}`, borderRadius: radius.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={miniLabelStyle}>Tak</label>
                        <select value={nieuwTakId} onChange={(e) => setNieuwTakId(e.target.value)} style={inputStyle}>
                          {takken.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.naam}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={miniLabelStyle}>Startjaar werkingsjaar</label>
                        <input type="number" min={STARTJAAR} value={nieuwJaar} onChange={(e) => setNieuwJaar(e.target.value)} style={{ ...inputStyle, width: 120 }} />
                      </div>
                    </div>
                    <div>
                      <label style={miniLabelStyle}>Leiding</label>
                      <MemberTagPicker value={nieuwLeden} onChange={setNieuwLeden} />
                    </div>
                    <button
                      onClick={nieuweLeidingOpslaan}
                      disabled={nieuwOpslaanBezig}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '8px 18px',
                        borderRadius: radius.badge,
                        border: 'none',
                        background: colors.forest,
                        color: colors.white,
                        fontFamily: fonts.body,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {nieuwOpslaanBezig ? 'Bezig…' : 'Opslaan'}
                    </button>
                  </div>
                )}

                <div ref={scrollLeidingRef} onScroll={handleScrollLeiding} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                  <div style={{ width: totaleBreedte, position: 'relative' }}>
                    {takken.map((tak) => {
                      const items = leidingLijst.filter((l) => l.takId === tak.id);
                      return (
                        <div key={tak.id} style={{ position: 'relative', height: 30 }}>
                          <RijLabel>{tak.naam}</RijLabel>
                          {items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => openLeidingDetail(tak.id, item.werkingsjaarStart)}
                              title={`${tak.naam} ${werkingsjaarLabel(item.werkingsjaarStart)}`}
                              style={{
                                position: 'absolute',
                                left: pixelFor(item.werkingsjaarStart),
                                top: 7,
                                transform: 'translateX(-50%)',
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: colors.forest,
                                border: `2px solid ${colors.paperCard}`,
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                    <Jaarlijn jaar={zichtbaarJaar} />
                  </div>
                </div>
              </div>
            )}

            {/* Detail: geselecteerde leidingsploeg (tak + jaar), met bewerk-gate */}
            {geselecteerdeLeiding && (
              <div
                style={{
                  marginTop: 12,
                  background: colors.paperCard,
                  border: `1.5px solid ${colors.forest}`,
                  borderRadius: radius.card,
                  padding: '20px 22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 700, color: colors.ink }}>
                      {geselecteerdeLeidingTakNaam}
                    </div>
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
                      {werkingsjaarLabel(geselecteerdeLeiding.werkingsjaarStart)}
                    </div>
                  </div>
                  <button
                    onClick={() => setGeselecteerdeLeiding(null)}
                    style={{ background: 'none', border: 'none', fontSize: 18, color: colors.inkMuted, cursor: 'pointer' }}
                    aria-label="Sluiten"
                  >
                    ✕
                  </button>
                </div>

                {!leidingBewerkModus ? (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {(geselecteerdeLeidingItem?.leden || []).length > 0 ? (
                        geselecteerdeLeidingItem.leden.map((lid, i) => (
                          <span
                            key={i}
                            style={{
                              fontFamily: fonts.display,
                              fontSize: 14,
                              fontWeight: 600,
                              color: colors.ink,
                              background: colors.white,
                              border: `1px solid ${colors.line}`,
                              borderRadius: radius.badge,
                              padding: '4px 12px',
                            }}
                          >
                            {lid.naam}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>Nog niemand ingevuld.</span>
                      )}
                    </div>
                    <button
                      onClick={startLeidingBewerken}
                      style={{
                        padding: '8px 18px',
                        borderRadius: radius.badge,
                        border: 'none',
                        background: colors.forest,
                        color: colors.white,
                        fontFamily: fonts.body,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      ✏️ Bewerken
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <MemberTagPicker value={leidingBewerkLeden} onChange={setLeidingBewerkLeden} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={leidingOpslaan}
                        disabled={leidingOpslaanBezig}
                        style={{
                          padding: '9px 20px',
                          borderRadius: radius.badge,
                          border: 'none',
                          background: leidingOpslaanBezig ? colors.inkMuted : colors.forest,
                          color: colors.white,
                          fontFamily: fonts.body,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: leidingOpslaanBezig ? 'default' : 'pointer',
                        }}
                      >
                        {leidingOpslaanBezig ? 'Bezig…' : 'Opslaan'}
                      </button>
                      <button
                        onClick={() => setLeidingBewerkModus(false)}
                        style={{
                          padding: '9px 20px',
                          borderRadius: radius.badge,
                          border: `1px solid ${colors.line}`,
                          background: 'transparent',
                          color: colors.inkMuted,
                          fontFamily: fonts.body,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Annuleren
                      </button>
                    </div>
                    <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, margin: 0 }}>
                      Iedereen kan dit aanvullen of corrigeren — help mee de geschiedenis reconstrueren.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Box: leden */}
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
              <div style={{ width: totaleBreedte, position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                            paddingLeft: 12,
                            boxSizing: 'border-box',
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
                <Jaarlijn jaar={zichtbaarJaar} />
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

function Jaarlijn({ jaar }) {
  const left = NAAM_KOLOM + (jaar - STARTJAAR) * PX_PER_JAAR;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: 0,
        bottom: 0,
        width: 1,
        background: colors.campfire,
        opacity: 0.45,
        pointerEvents: 'none',
      }}
    />
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
        paddingLeft: 12,
        boxSizing: 'border-box',
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

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: radius.input,
  border: `1px solid ${colors.line}`,
  background: colors.white,
  fontFamily: fonts.body,
  fontSize: 13,
  color: colors.ink,
  boxSizing: 'border-box',
};

const miniLabelStyle = {
  display: 'block',
  fontFamily: fonts.body,
  fontSize: 11,
  fontWeight: 600,
  color: colors.inkMuted,
  marginBottom: 3,
};
