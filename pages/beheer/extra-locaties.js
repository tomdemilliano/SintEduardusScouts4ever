import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { ExtraLocationFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import RequireAuth from '../../components/RequireAuth';

const LocationPicker = dynamic(() => import('../../components/LocationPicker'), { ssr: false });

export default function ExtraLocatiesPage() {
  return (
    <RequireAuth>
      <ExtraLocatiesContent />
    </RequireAuth>
  );
}

function ExtraLocatiesContent() {
  const [locaties, setLocaties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bewerkId, setBewerkId] = useState(null);

  const load = async () => {
    setLoading(true);
    setLocaties(await ExtraLocationFactory.getAllAdmin());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerwijderen = async (loc) => {
    if (!confirm(`"${loc.naam}" verwijderen?`)) return;
    await ExtraLocationFactory.remove(loc.id);
    load();
  };

  const handleGoedkeuren = async (loc) => {
    await ExtraLocationFactory.approve(loc.id);
    load();
  };

  const pending = locaties.filter((l) => l.status === 'pending');
  const gepubliceerd = locaties.filter((l) => l.status === 'published');

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Extra kampplaatsen — Beheer</title>
      </Head>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
        <a href="/beheer" style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textDecoration: 'none' }}>
          ← Terug naar overzicht
        </a>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '12px 0 6px' }}>
          Extra kampplaatsen
        </h1>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 28 }}>
          Los toegevoegde of door bezoekers voorgestelde plekken — dit zijn
          géén "beste kampplaats"-stemmen uit de vriendenboekjes (die beheer
          je via <a href="/beheer/locaties" style={{ color: colors.forest }}>Kampplaatsen koppelen</a>).
        </p>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        {/* Nog goed te keuren */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.campfire, marginBottom: 10 }}>
              Nog goed te keuren ({pending.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map((loc) =>
                bewerkId === loc.id ? (
                  <LocatieForm key={loc.id} locatie={loc} onOpgeslagen={() => { setBewerkId(null); load(); }} onAnnuleren={() => setBewerkId(null)} achtergrond={colors.campfireLight} rand={colors.campfire} toonGoedkeuren onGoedkeuren={() => handleGoedkeuren(loc)} />
                ) : (
                  <div
                    key={loc.id}
                    style={{
                      background: colors.campfireLight,
                      border: `1.5px dashed ${colors.campfire}`,
                      borderRadius: radius.card,
                      padding: '14px 18px',
                    }}
                  >
                    <div style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, color: colors.ink }}>
                      {loc.naam}
                    </div>
                    {loc.beschrijving && (
                      <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, margin: '6px 0' }}>{loc.beschrijving}</p>
                    )}
                    {loc.contactEmail && (
                      <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
                        Ingestuurd door: {loc.contactEmail}
                      </div>
                    )}
                    {loc.lat != null ? (
                      <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forest, marginTop: 4 }}>
                        📍 Bezoeker koos al een locatie: {loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}
                      </div>
                    ) : (
                      <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.stamp, marginTop: 4 }}>
                        ⚠ Nog geen coördinaten — zet de locatie op de kaart voor je goedkeurt.
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      {loc.lat != null && (
                        <button onClick={() => handleGoedkeuren(loc)} style={btn(colors.forest)}>
                          Goedkeuren
                        </button>
                      )}
                      <button onClick={() => setBewerkId(loc.id)} style={btn(colors.inkMuted)}>
                        {loc.lat != null ? 'Bewerken' : 'Coördinaten instellen & bewerken'}
                      </button>
                      <button onClick={() => handleVerwijderen(loc)} style={btn(colors.stamp)}>
                        Afwijzen
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Nieuwe locatie toevoegen */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkMuted, marginBottom: 10 }}>
            Locatie toevoegen
          </div>
          <LocatieForm onOpgeslagen={load} />
        </div>

        {/* Gepubliceerd */}
        <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkMuted, marginBottom: 10 }}>
          Gepubliceerd ({gepubliceerd.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gepubliceerd.map((loc) =>
            bewerkId === loc.id ? (
              <LocatieForm key={loc.id} locatie={loc} onOpgeslagen={() => { setBewerkId(null); load(); }} onAnnuleren={() => setBewerkId(null)} achtergrond={colors.paperCard} rand={colors.forest} />
            ) : (
              <div
                key={loc.id}
                style={{
                  background: colors.paperCard,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.card,
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 600, color: colors.ink }}>
                    {loc.naam}
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
                    {loc.lat != null ? `📍 ${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}` : 'geen coördinaten'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setBewerkId(loc.id)} style={btn(colors.inkMuted)}>
                    Bewerken
                  </button>
                  <button onClick={() => handleVerwijderen(loc)} style={btn(colors.stamp)}>
                    Verwijderen
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {!loading && gepubliceerd.length === 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Nog geen extra kampplaatsen gepubliceerd.</p>
        )}
      </div>
    </div>
  );
}

function LocatieForm({ locatie, onOpgeslagen, onAnnuleren, achtergrond = colors.paperCard, rand = colors.line, toonGoedkeuren, onGoedkeuren }) {
  const [naam, setNaam] = useState(locatie?.naam || '');
  const [beschrijving, setBeschrijving] = useState(locatie?.beschrijving || '');
  const [lat, setLat] = useState(locatie?.lat != null ? String(locatie.lat) : '');
  const [lng, setLng] = useState(locatie?.lng != null ? String(locatie.lng) : '');
  const [zoekterm, setZoekterm] = useState(locatie?.naam || '');
  const [resultaten, setResultaten] = useState(null);
  const [zoekend, setZoekend] = useState(false);
  const [kaartOpen, setKaartOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);

  const zoekLocatie = async () => {
    setZoekend(true);
    setFout(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(zoekterm)}`);
      setResultaten(await res.json());
    } catch (e) {
      setResultaten([]);
    } finally {
      setZoekend(false);
    }
  };

  const kiesResultaat = (r) => {
    setLat(r.lat);
    setLng(r.lon);
    setResultaten(null);
  };

  const opslaan = async (publicerenOok) => {
    if (!naam.trim()) {
      setFout('Vul een naam in.');
      return;
    }
    const latNum = lat ? parseFloat(String(lat).replace(',', '.')) : null;
    const lngNum = lng ? parseFloat(String(lng).replace(',', '.')) : null;
    setBezig(true);
    setFout(null);
    try {
      if (locatie) {
        await ExtraLocationFactory.update(locatie.id, { naam: naam.trim(), beschrijving: beschrijving.trim(), lat: latNum, lng: lngNum });
        if (publicerenOok) await ExtraLocationFactory.approve(locatie.id);
      } else {
        await ExtraLocationFactory.createByAdmin({ naam: naam.trim(), beschrijving: beschrijving.trim(), lat: latNum, lng: lngNum });
        setNaam('');
        setBeschrijving('');
        setLat('');
        setLng('');
        setZoekterm('');
      }
      onOpgeslagen();
    } catch (err) {
      setFout('Opslaan mislukt, probeer opnieuw.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div style={{ background: achtergrond, border: `1.5px solid ${rand}`, borderRadius: radius.card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={labelStyle}>Naam</label>
        <input type="text" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="bv. Provinciaal domein Zilvermeer" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Beschrijving (optioneel)</label>
        <textarea value={beschrijving} onChange={(e) => setBeschrijving(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          placeholder="Zoekterm voor coördinaten"
          style={{ ...inputStyle, flex: 1, minWidth: 160 }}
        />
        <button onClick={zoekLocatie} disabled={zoekend} style={btn(colors.forest)}>
          {zoekend ? 'Bezig…' : 'Zoeken'}
        </button>
        <button onClick={() => setKaartOpen((v) => !v)} style={btn(kaartOpen ? colors.inkMuted : colors.campfire)}>
          {kaartOpen ? 'Kaart verbergen' : 'Kies op kaart'}
        </button>
      </div>

      {kaartOpen && (
        <div style={{ border: `1px solid ${colors.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
          <LocationPicker
            lat={lat ? parseFloat(String(lat).replace(',', '.')) : null}
            lng={lng ? parseFloat(String(lng).replace(',', '.')) : null}
            onPick={(la, ln) => {
              setLat(la.toFixed(5));
              setLng(ln.toFixed(5));
            }}
          />
        </div>
      )}

      {resultaten && resultaten.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {resultaten.map((r, i) => (
            <button key={i} onClick={() => kiesResultaat(r)} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: radius.input, border: `1px solid ${colors.line}`, background: colors.white, fontFamily: fonts.body, fontSize: 12, color: colors.ink, cursor: 'pointer' }}>
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <label style={labelStyle}>Lat</label>
          <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="50.1234" style={{ ...inputStyle, width: 130 }} />
        </div>
        <div>
          <label style={labelStyle}>Lng</label>
          <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="5.1234" style={{ ...inputStyle, width: 130 }} />
        </div>
      </div>

      {fout && <div style={{ color: colors.stamp, fontFamily: fonts.body, fontSize: 13 }}>{fout}</div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => opslaan(false)} disabled={bezig} style={btn(colors.forest)}>
          {bezig ? 'Bezig…' : locatie ? 'Wijzigingen opslaan' : '+ Locatie toevoegen'}
        </button>
        {toonGoedkeuren && (
          <button onClick={() => opslaan(true)} disabled={bezig} style={btn(colors.campfire)}>
            Opslaan &amp; goedkeuren
          </button>
        )}
        {onAnnuleren && (
          <button onClick={onAnnuleren} style={btn(colors.inkMuted)}>
            Annuleren
          </button>
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
