import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { TakFactory, LeidingFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import { huidigWerkingsjaarStart, werkingsjaarLabel } from '../../../lib/utils';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';
import MemberTagPicker from '../../../components/MemberTagPicker';

const TABS = [
  { href: '/beheer/tijdlijn', label: '🚩 Mijlpalen', exact: true },
  { href: '/beheer/tijdlijn/kentekens', label: '🧭 Kentekens' },
  { href: '/beheer/tijdlijn/takken', label: '👥 Takken' },
  { href: '/beheer/tijdlijn/leiding', label: 'Leidingsploegen' },
];

export default function LeidingPage() {
  return (
    <RequireAuth>
      <LeidingContent />
    </RequireAuth>
  );
}

function LeidingContent() {
  const router = useRouter();
  const [takken, setTakken] = useState([]);
  const [leidingLijst, setLeidingLijst] = useState([]);
  const [loading, setLoading] = useState(true);

  const [takId, setTakId] = useState('');
  const [werkingsjaar, setWerkingsjaar] = useState(String(huidigWerkingsjaarStart()));
  const [leden, setLeden] = useState([]);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);

  const load = async () => {
    setLoading(true);
    const [t, l] = await Promise.all([TakFactory.getAll(), LeidingFactory.getAll()]);
    setTakken(t);
    setLeidingLijst(l);
    if (!takId && t.length > 0) setTakId(t[0].id);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vanuit het activiteitenlog rechtstreeks naar de betrokken leidingsploeg
  // springen: laadt 'm meteen in het bewerkformulier, zoals bij "Bewerken".
  useEffect(() => {
    if (!router.isReady || loading) return;
    const { tak: takQ, jaar: jaarQ } = router.query;
    if (takQ && jaarQ) {
      const jaarNum = parseInt(jaarQ, 10);
      const item = leidingLijst.find((l) => l.takId === takQ && l.werkingsjaarStart === jaarNum);
      if (item) bewerken(item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query, loading, leidingLijst]);

  const handleOpslaan = async () => {
    setFout(null);
    const jaarNum = parseInt(werkingsjaar, 10);
    if (!takId) {
      setFout('Kies eerst een tak (maak er eventueel eerst één aan via het tabblad "Takken").');
      return;
    }
    if (!jaarNum || jaarNum < 1944) {
      setFout('Vul een geldig startjaar in (1944 of later).');
      return;
    }
    setBezig(true);
    try {
      await LeidingFactory.set(takId, jaarNum, leden);
      setLeden([]);
      load();
    } finally {
      setBezig(false);
    }
  };

  const bewerken = (item) => {
    setTakId(item.takId);
    setWerkingsjaar(String(item.werkingsjaarStart));
    setLeden(item.leden || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const verwijderen = async (item) => {
    const takNaam = takken.find((t) => t.id === item.takId)?.naam || item.takId;
    if (!confirm(`Leidingsploeg ${takNaam} ${werkingsjaarLabel(item.werkingsjaarStart)} verwijderen?`)) return;
    await LeidingFactory.remove(item.takId, item.werkingsjaarStart);
    load();
  };

  // Groeperen per werkingsjaar, aflopend
  const perJaar = {};
  leidingLijst.forEach((item) => {
    if (!perJaar[item.werkingsjaarStart]) perJaar[item.werkingsjaarStart] = [];
    perJaar[item.werkingsjaarStart].push(item);
  });
  const jaren = Object.keys(perJaar)
    .map((j) => parseInt(j, 10))
    .sort((a, b) => b - a);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Leidingsploegen — Beheer tijdlijn</title>
      </Head>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Tijdlijn
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Leidingsploegen
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 20 }}>
          De leidingsploeg per tak, per werkingsjaar. Vul een bestaande
          combinatie opnieuw in om ze te overschrijven/bewerken.
        </p>

        {takken.length === 0 && !loading && (
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.stamp, marginBottom: 16 }}>
            Er zijn nog geen takken aangemaakt — ga eerst naar het tabblad "Takken".
          </p>
        )}

        <div
          style={{
            background: colors.paperCard,
            border: `1.5px dashed ${colors.line}`,
            borderRadius: radius.card,
            padding: '18px 20px',
            marginBottom: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>Tak</label>
              <select value={takId} onChange={(e) => setTakId(e.target.value)} style={inputStyle}>
                {takken.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.naam}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Startjaar werkingsjaar</label>
              <input
                type="number"
                min="1944"
                value={werkingsjaar}
                onChange={(e) => setWerkingsjaar(e.target.value)}
                style={{ ...inputStyle, width: 120 }}
              />
              {werkingsjaar && !isNaN(parseInt(werkingsjaar, 10)) && (
                <div style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, marginTop: 3 }}>
                  = {werkingsjaarLabel(parseInt(werkingsjaar, 10))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Leiding</label>
            <MemberTagPicker value={leden} onChange={setLeden} />
          </div>

          {fout && <div style={{ color: colors.stamp, fontFamily: fonts.body, fontSize: 13 }}>{fout}</div>}

          <button onClick={handleOpslaan} disabled={bezig} style={{ ...btn(colors.forest), alignSelf: 'flex-start' }}>
            {bezig ? 'Bezig…' : 'Opslaan'}
          </button>
        </div>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        {jaren.map((jaar) => (
          <div key={jaar} style={{ marginBottom: 24 }}>
            <div
              style={{
                fontFamily: fonts.display,
                fontSize: 18,
                fontWeight: 700,
                color: colors.forestDark,
                marginBottom: 8,
              }}
            >
              {werkingsjaarLabel(jaar)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {perJaar[jaar].map((item) => {
                const takNaam = takken.find((t) => t.id === item.takId)?.naam || '(onbekende tak)';
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      background: colors.paperCard,
                      border: `1px solid ${colors.line}`,
                      borderRadius: radius.card,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.ink, minWidth: 100 }}>
                      {takNaam}
                    </span>
                    <span style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
                      {(item.leden || []).map((l) => l.naam).join(', ') || <em>geen leiding ingevuld</em>}
                    </span>
                    <button onClick={() => bewerken(item)} style={btn(colors.inkMuted)}>
                      Bewerken
                    </button>
                    <button onClick={() => verwijderen(item)} style={btn(colors.stamp)}>
                      Verwijderen
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!loading && jaren.length === 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Nog geen leidingsploegen ingevuld.</p>
        )}
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
    padding: '8px 16px',
    borderRadius: 999,
    border: 'none',
    background: color,
    color: '#FFF',
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}
