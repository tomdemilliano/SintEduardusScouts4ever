import { useEffect, useState } from 'react';
import Head from 'next/head';
import { MijlpaalFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import RequireAuth from '../../components/RequireAuth';

export default function MijlpalenPage() {
  return (
    <RequireAuth>
      <MijlpalenContent />
    </RequireAuth>
  );
}

const leegNieuw = { jaar: '', titel: '', beschrijving: '' };

function MijlpalenContent() {
  const [mijlpalen, setMijlpalen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nieuw, setNieuw] = useState(leegNieuw);
  const [nieuwBestand, setNieuwBestand] = useState(null);
  const [toevoegBezig, setToevoegBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState(null);
  const [bewerkId, setBewerkId] = useState(null);

  const load = async () => {
    setLoading(true);
    setMijlpalen(await MijlpaalFactory.getAllAdmin());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleToevoegen = async () => {
    setFoutmelding(null);
    const jaarNum = parseInt(nieuw.jaar, 10);
    if (!jaarNum || !nieuw.titel.trim()) {
      setFoutmelding('Jaar en titel zijn verplicht.');
      return;
    }
    setToevoegBezig(true);
    try {
      await MijlpaalFactory.createByAdmin({
        jaar: jaarNum,
        titel: nieuw.titel.trim(),
        beschrijving: nieuw.beschrijving.trim(),
        file: nieuwBestand,
      });
      setNieuw(leegNieuw);
      setNieuwBestand(null);
      load();
    } catch (err) {
      setFoutmelding('Opslaan mislukt, probeer opnieuw.');
    } finally {
      setToevoegBezig(false);
    }
  };

  const handleGoedkeuren = async (m) => {
    await MijlpaalFactory.approve(m.id);
    load();
  };

  const handleVerwijderen = async (m) => {
    if (!confirm(`Mijlpaal "${m.titel}" verwijderen?`)) return;
    await MijlpaalFactory.remove(m.id, m.afbeeldingPath);
    load();
  };

  const handleOpslaanBewerking = async (id, velden, file) => {
    await MijlpaalFactory.update(id, {
      ...velden,
      file,
      bestaandePath: mijlpalen.find((m) => m.id === id)?.afbeeldingPath,
    });
    setBewerkId(null);
    load();
  };

  const pending = mijlpalen.filter((m) => m.status === 'pending');
  const gepubliceerd = mijlpalen.filter((m) => m.status === 'published');

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Mijlpalen — Beheer</title>
      </Head>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
        <a href="/beheer" style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textDecoration: 'none' }}>
          ← Terug naar overzicht
        </a>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '12px 0 6px' }}>
          Mijlpalen
        </h1>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 28 }}>
          Belangrijke momenten uit de geschiedenis van de groep, te zien op de tijdlijn.
        </p>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        {/* Nog goed te keuren */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.campfire, marginBottom: 10 }}>
              Nog goed te keuren ({pending.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map((m) =>
                bewerkId === m.id ? (
                  <MijlpaalBewerkForm
                    key={m.id}
                    mijlpaal={m}
                    onOpslaan={(velden, file) => handleOpslaanBewerking(m.id, velden, file)}
                    onAnnuleren={() => setBewerkId(null)}
                    achtergrond={colors.campfireLight}
                    rand={colors.campfire}
                  />
                ) : (
                  <div
                    key={m.id}
                    style={{
                      background: colors.campfireLight,
                      border: `1.5px dashed ${colors.campfire}`,
                      borderRadius: radius.card,
                      padding: '14px 18px',
                    }}
                  >
                    <div style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, color: colors.ink }}>
                      {m.jaar} — {m.titel}
                    </div>
                    {m.beschrijving && (
                      <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, margin: '6px 0' }}>
                        {m.beschrijving}
                      </p>
                    )}
                    {m.contactEmail && (
                      <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
                        Ingestuurd door: {m.contactEmail}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => handleGoedkeuren(m)} style={btn(colors.forest)}>
                        Goedkeuren
                      </button>
                      <button onClick={() => setBewerkId(m.id)} style={btn(colors.inkMuted)}>
                        Bewerken
                      </button>
                      <button onClick={() => handleVerwijderen(m)} style={btn(colors.stamp)}>
                        Afwijzen
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Nieuwe mijlpaal toevoegen */}
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
            Mijlpaal toevoegen
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Jaar</label>
              <input
                type="number"
                value={nieuw.jaar}
                onChange={(e) => setNieuw((p) => ({ ...p, jaar: e.target.value }))}
                placeholder="1944"
                style={{ ...inputStyle, width: 100 }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Titel</label>
              <input
                type="text"
                value={nieuw.titel}
                onChange={(e) => setNieuw((p) => ({ ...p, titel: e.target.value }))}
                placeholder="bv. Oprichting van de groep"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Beschrijving (optioneel)</label>
            <textarea
              value={nieuw.beschrijving}
              onChange={(e) => setNieuw((p) => ({ ...p, beschrijving: e.target.value }))}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <label style={{ ...labelStyle, cursor: 'pointer' }}>
            Afbeelding (optioneel)
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
            {toevoegBezig ? 'Bezig…' : '+ Mijlpaal toevoegen'}
          </button>
        </div>

        {/* Alle gepubliceerde mijlpalen */}
        <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkMuted, marginBottom: 10 }}>
          Gepubliceerd ({gepubliceerd.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {gepubliceerd.map((m) =>
            bewerkId === m.id ? (
              <MijlpaalBewerkForm
                key={m.id}
                mijlpaal={m}
                onOpslaan={(velden, file) => handleOpslaanBewerking(m.id, velden, file)}
                onAnnuleren={() => setBewerkId(null)}
                achtergrond={colors.paperCard}
                rand={colors.line}
              />
            ) : (
              <div
                key={m.id}
                style={{
                  background: colors.paperCard,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.card,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {m.afbeeldingUrl && (
                  <img
                    src={m.afbeeldingUrl}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: radius.input, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 600, color: colors.ink }}>
                    {m.jaar} — {m.titel}
                  </div>
                  {m.beschrijving && (
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>{m.beschrijving}</div>
                  )}
                </div>
                <button onClick={() => setBewerkId(m.id)} style={btn(colors.inkMuted)}>
                  Bewerken
                </button>
                <button onClick={() => handleVerwijderen(m)} style={btn(colors.stamp)}>
                  Verwijderen
                </button>
              </div>
            )
          )}
        </div>

        {!loading && gepubliceerd.length === 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Nog geen mijlpalen gepubliceerd.</p>
        )}
      </div>
    </div>
  );
}

function MijlpaalBewerkForm({ mijlpaal, onOpslaan, onAnnuleren, achtergrond, rand }) {
  const [jaar, setJaar] = useState(String(mijlpaal.jaar));
  const [titel, setTitel] = useState(mijlpaal.titel || '');
  const [beschrijving, setBeschrijving] = useState(mijlpaal.beschrijving || '');
  const [bestand, setBestand] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);

  const opslaan = async () => {
    const jaarNum = parseInt(jaar, 10);
    if (!jaarNum || !titel.trim()) {
      setFout('Jaar en titel zijn verplicht.');
      return;
    }
    setBezig(true);
    setFout(null);
    try {
      await onOpslaan({ jaar: jaarNum, titel: titel.trim(), beschrijving: beschrijving.trim() }, bestand);
    } catch (err) {
      setFout('Opslaan mislukt, probeer opnieuw.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div
      style={{
        background: achtergrond,
        border: `1.5px solid ${rand}`,
        borderRadius: radius.card,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {mijlpaal.afbeeldingUrl && (
        <img
          src={mijlpaal.afbeeldingUrl}
          alt=""
          style={{ width: 60, height: 60, borderRadius: radius.input, objectFit: 'cover' }}
        />
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <label style={labelStyle}>Jaar</label>
          <input type="number" value={jaar} onChange={(e) => setJaar(e.target.value)} style={{ ...inputStyle, width: 100 }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Titel</label>
          <input type="text" value={titel} onChange={(e) => setTitel(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Beschrijving</label>
        <textarea
          value={beschrijving}
          onChange={(e) => setBeschrijving(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
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
