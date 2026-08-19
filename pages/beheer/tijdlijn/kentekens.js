import { useEffect, useState } from 'react';
import Head from 'next/head';
import { KentekenFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import { huidigWerkingsjaarStart, werkingsjaarLabel } from '../../../lib/utils';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/tijdlijn', label: '🚩 Mijlpalen', exact: true },
  { href: '/beheer/tijdlijn/kentekens', label: '🧭 Kentekens' },
];

export default function KentekensPage() {
  return (
    <RequireAuth>
      <KentekensContent />
    </RequireAuth>
  );
}

function KentekensContent() {
  const [kentekens, setKentekens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nieuwJaar, setNieuwJaar] = useState(String(huidigWerkingsjaarStart()));
  const [nieuwLeuze, setNieuwLeuze] = useState('');
  const [nieuwBestand, setNieuwBestand] = useState(null);
  const [toevoegBezig, setToevoegBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState(null);
  const [bewerkJaar, setBewerkJaar] = useState(null);

  const load = async () => {
    setLoading(true);
    setKentekens(await KentekenFactory.getAll());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleToevoegen = async () => {
    setFoutmelding(null);
    const jaarNum = parseInt(nieuwJaar, 10);
    if (!jaarNum || jaarNum < 1944) {
      setFoutmelding('Vul een geldig startjaar in (1944 of later).');
      return;
    }
    setToevoegBezig(true);
    try {
      await KentekenFactory.set(jaarNum, { jaarleuze: nieuwLeuze.trim(), file: nieuwBestand });
      setNieuwLeuze('');
      setNieuwBestand(null);
      load();
    } catch (err) {
      setFoutmelding('Opslaan mislukt, probeer opnieuw.');
    } finally {
      setToevoegBezig(false);
    }
  };

  const handleVerwijderen = async (k) => {
    if (!confirm(`Kenteken ${werkingsjaarLabel(k.startJaar)} verwijderen?`)) return;
    await KentekenFactory.remove(k.startJaar, k.afbeeldingPath);
    load();
  };

  const handleOpslaanBewerking = async (k, jaarleuze, file) => {
    await KentekenFactory.set(k.startJaar, { jaarleuze, file, bestaandePath: k.afbeeldingPath });
    setBewerkJaar(null);
    load();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Jaarkentekens — Beheer</title>
      </Head>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Tijdlijn
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Jaarkentekens
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 28 }}>
          Eén kenteken met jaarleuze per werkingsjaar (start in september).
          Deze verschijnen op de tijdlijn.
        </p>

        {/* Nieuw kenteken */}
        <div
          style={{
            background: colors.paperCard,
            border: `1.5px dashed ${colors.line}`,
            borderRadius: radius.card,
            padding: '18px 20px',
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkMuted }}>
            Kenteken toevoegen / bijwerken
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Startjaar werkingsjaar</label>
              <input
                type="number"
                min="1944"
                value={nieuwJaar}
                onChange={(e) => setNieuwJaar(e.target.value)}
                style={{ ...inputStyle, width: 110 }}
              />
              {nieuwJaar && !isNaN(parseInt(nieuwJaar, 10)) && (
                <div style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, marginTop: 3 }}>
                  = {werkingsjaarLabel(parseInt(nieuwJaar, 10))}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>Jaarleuze</label>
              <input
                type="text"
                value={nieuwLeuze}
                onChange={(e) => setNieuwLeuze(e.target.value)}
                placeholder="bv. Samen op weg"
                style={inputStyle}
              />
            </div>
          </div>
          <label style={{ ...labelStyle, cursor: 'pointer' }}>
            Afbeelding van het kenteken (optioneel — laat leeg om een bestaande te behouden)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNieuwBestand(e.target.files?.[0] || null)}
              style={{ display: 'block', marginTop: 6, fontFamily: fonts.body, fontSize: 13 }}
            />
          </label>
          {foutmelding && (
            <div style={{ color: colors.stamp, fontFamily: fonts.body, fontSize: 13 }}>{foutmelding}</div>
          )}
          <button onClick={handleToevoegen} disabled={toevoegBezig} style={btn(colors.forest)}>
            {toevoegBezig ? 'Bezig…' : 'Opslaan'}
          </button>
        </div>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {kentekens.map((k) =>
            bewerkJaar === k.startJaar ? (
              <KentekenBewerkForm
                key={k.id}
                kenteken={k}
                onOpslaan={(jaarleuze, file) => handleOpslaanBewerking(k, jaarleuze, file)}
                onAnnuleren={() => setBewerkJaar(null)}
              />
            ) : (
              <div
                key={k.id}
                style={{
                  background: colors.paperCard,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.card,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                {k.afbeeldingUrl ? (
                  <img
                    src={k.afbeeldingUrl}
                    alt={werkingsjaarLabel(k.startJaar)}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${colors.line}`, flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: colors.campfireLight,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 600, color: colors.ink }}>
                    {werkingsjaarLabel(k.startJaar)}
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
                    {k.jaarleuze || <em>geen jaarleuze</em>}
                  </div>
                </div>
                <button onClick={() => setBewerkJaar(k.startJaar)} style={btn(colors.inkMuted)}>
                  Bewerken
                </button>
                <button onClick={() => handleVerwijderen(k)} style={btn(colors.stamp)}>
                  Verwijderen
                </button>
              </div>
            )
          )}
        </div>

        {!loading && kentekens.length === 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Nog geen kentekens toegevoegd.</p>
        )}
      </div>
    </div>
  );
}

function KentekenBewerkForm({ kenteken, onOpslaan, onAnnuleren }) {
  const [jaarleuze, setJaarleuze] = useState(kenteken.jaarleuze || '');
  const [bestand, setBestand] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);

  const opslaan = async () => {
    setBezig(true);
    setFout(null);
    try {
      await onOpslaan(jaarleuze.trim(), bestand);
    } catch (err) {
      setFout('Opslaan mislukt, probeer opnieuw.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div
      style={{
        background: colors.paperCard,
        border: `1.5px solid ${colors.forest}`,
        borderRadius: radius.card,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {kenteken.afbeeldingUrl && (
          <img
            src={kenteken.afbeeldingUrl}
            alt=""
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${colors.line}` }}
          />
        )}
        <div style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 600, color: colors.ink }}>
          {werkingsjaarLabel(kenteken.startJaar)}
          <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 400, color: colors.inkMuted, marginLeft: 8 }}>
            (werkingsjaar kan niet gewijzigd worden — verwijder en voeg opnieuw toe indien nodig)
          </span>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Jaarleuze</label>
        <input type="text" value={jaarleuze} onChange={(e) => setJaarleuze(e.target.value)} style={inputStyle} />
      </div>

      <label style={{ ...labelStyle, cursor: 'pointer' }}>
        Nieuwe afbeelding (optioneel — laat leeg om de bestaande te behouden)
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBestand(e.target.files?.[0] || null)}
          style={{ display: 'block', marginTop: 6, fontFamily: fonts.body, fontSize: 13 }}
        />
      </label>

      {fout && <div style={{ color: colors.stamp, fontFamily: fonts.body, fontSize: 13 }}>{fout}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={opslaan} disabled={bezig} style={btn(colors.forest)}>
          {bezig ? 'Bezig…' : 'Wijzigingen opslaan'}
        </button>
        <button onClick={onAnnuleren} style={btn(colors.inkMuted)}>
          Annuleren
        </button>
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
    padding: '9px 16px',
    borderRadius: 999,
    border: 'none',
    background: color,
    color: '#FFF',
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-start',
  };
}
