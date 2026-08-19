import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { EntryFactory, LocationFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import { groupByArrayField } from '../../../lib/utils';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/kampplaatsen', label: '❤️ Uit vriendenboekjes', exact: true },
  { href: '/beheer/kampplaatsen/extra', label: '📍 Extra kampplaatsen' },
];

const LocationPicker = dynamic(() => import('../../../components/LocationPicker'), { ssr: false });

export default function LocatiesPage() {
  return (
    <RequireAuth>
      <LocatiesContent />
    </RequireAuth>
  );
}

function LocatiesContent() {
  const [groepen, setGroepen] = useState([]);
  const [locaties, setLocaties] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('alle'); // alle | niet-gekoppeld

  const load = async () => {
    setLoading(true);
    const [entries, locs] = await Promise.all([EntryFactory.getAll(), LocationFactory.getAll()]);
    setGroepen(groupByArrayField(entries, 'besteKampplaats'));
    const byId = {};
    locs.forEach((l) => (byId[l.id] = l));
    setLocaties(byId);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const isGekoppeld = (groep) => Boolean(locaties[groep.label.trim().toLowerCase()]);
  const gefilterd = filter === 'niet-gekoppeld' ? groepen.filter((g) => !isGekoppeld(g)) : groepen;
  const aantalNietGekoppeld = groepen.filter((g) => !isGekoppeld(g)).length;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Kampplaatsen koppelen — Beheer</title>
      </Head>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Kampplaatsen
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Kampplaatsen op de kaart (uit de vriendenboekjes)
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 20 }}>
          Zoek elke kampplaats op, kies "Kies op kaart" om de locatie zelf aan
          te klikken of te verslepen, of vul de coördinaten manueel in (bv.
          via rechtsklik op Google Maps → coördinaten kopiëren) als de
          automatische zoekfunctie de juiste plek niet vindt. Plaatsen zonder
          coördinaten verschijnen gewoon niet op de kaart.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkMuted, marginRight: 2 }}>
            Filter
          </span>
          <FilterButton active={filter === 'alle'} onClick={() => setFilter('alle')}>
            Alle ({groepen.length})
          </FilterButton>
          <FilterButton active={filter === 'niet-gekoppeld'} onClick={() => setFilter('niet-gekoppeld')}>
            Nog te koppelen {aantalNietGekoppeld > 0 && `(${aantalNietGekoppeld})`}
          </FilterButton>
        </div>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gefilterd.map((groep) => (
            <LocationCard
              key={groep.label}
              groep={groep}
              gekoppeld={locaties[groep.label.trim().toLowerCase()]}
              onChanged={load}
            />
          ))}
        </div>

        {!loading && gefilterd.length === 0 && groepen.length > 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>
            Alle kampplaatsen zijn gekoppeld. 🎉
          </p>
        )}
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? colors.forest : colors.line}`,
        background: active ? colors.forest : 'transparent',
        color: active ? colors.white : colors.inkMuted,
        fontFamily: fonts.body,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function LocationCard({ groep, gekoppeld, onChanged }) {
  const [zoekterm, setZoekterm] = useState(groep.label);
  const [resultaten, setResultaten] = useState(null);
  const [zoekend, setZoekend] = useState(false);
  const [lat, setLat] = useState(gekoppeld ? String(gekoppeld.lat) : '');
  const [lng, setLng] = useState(gekoppeld ? String(gekoppeld.lng) : '');
  const [opslaanBezig, setOpslaanBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState(null);
  const [kaartOpen, setKaartOpen] = useState(false);

  const zoekLocatie = async () => {
    setZoekend(true);
    setFoutmelding(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(zoekterm)}`
      );
      const data = await res.json();
      setResultaten(data);
    } catch (e) {
      setResultaten([]);
    } finally {
      setZoekend(false);
    }
  };

  const kiesResultaat = (r) => {
    // vult de manuele velden in, opslaan gebeurt pas via de "Opslaan"-knop
    // zodat je nog kan corrigeren voor je bevestigt
    setLat(r.lat);
    setLng(r.lon);
    setResultaten(null);
  };

  const opslaan = async () => {
    const latNum = parseFloat(lat.replace(',', '.'));
    const lngNum = parseFloat(lng.replace(',', '.'));
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setFoutmelding('Vul geldige coördinaten in (bv. 50.1234 en 5.1234).');
      return;
    }
    setOpslaanBezig(true);
    setFoutmelding(null);
    try {
      await LocationFactory.set(groep.label, latNum, lngNum);
      onChanged();
    } finally {
      setOpslaanBezig(false);
    }
  };

  const verwijderen = async () => {
    await LocationFactory.remove(groep.label);
    setLat('');
    setLng('');
    onChanged();
  };

  return (
    <div
      style={{
        background: colors.paperCard,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.card,
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, color: colors.ink }}>
          {groep.label}
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
          {groep.entries.length}× vermeld
          {gekoppeld && (
            <span style={{ color: colors.forest, fontWeight: 600 }}>
              {' '}· op de kaart ({gekoppeld.lat.toFixed(3)}, {gekoppeld.lng.toFixed(3)})
            </span>
          )}
        </div>
      </div>

      {/* Automatisch zoeken, met aanpasbare zoekterm */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          placeholder="Zoekterm (plaatsnaam, gemeente, land…)"
          style={inputStyle}
        />
        <button onClick={zoekLocatie} disabled={zoekend} style={btn(colors.forest)}>
          {zoekend ? 'Bezig…' : 'Zoeken'}
        </button>
        <button onClick={() => setKaartOpen((v) => !v)} style={btn(kaartOpen ? colors.inkMuted : colors.campfire)}>
          {kaartOpen ? 'Kaart verbergen' : 'Kies op kaart'}
        </button>
      </div>

      {kaartOpen && (
        <div style={{ marginTop: 10, border: `1px solid ${colors.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
          <LocationPicker
            lat={lat ? parseFloat(lat.replace(',', '.')) : null}
            lng={lng ? parseFloat(lng.replace(',', '.')) : null}
            onPick={(la, ln) => {
              setLat(la.toFixed(5));
              setLng(ln.toFixed(5));
            }}
          />
          <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, margin: '6px 10px' }}>
            Klik op de kaart om de pin te zetten, of sleep de bestaande pin naar de juiste plek.
          </p>
        </div>
      )}

      {resultaten && resultaten.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {resultaten.map((r, i) => (
            <button
              key={i}
              onClick={() => kiesResultaat(r)}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: radius.input,
                border: `1px solid ${colors.line}`,
                background: colors.white,
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.ink,
                cursor: 'pointer',
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
      {resultaten && resultaten.length === 0 && (
        <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginTop: 8 }}>
          Geen resultaten gevonden — probeer een andere zoekterm of vul de coördinaten hieronder manueel in.
        </p>
      )}

      {/* Manuele / corrigeerbare coördinaten */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
        <div>
          <label style={labelStyle}>Breedtegraad (lat)</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="50.1234"
            style={{ ...inputStyle, width: 140 }}
          />
        </div>
        <div>
          <label style={labelStyle}>Lengtegraad (lng)</label>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="5.1234"
            style={{ ...inputStyle, width: 140 }}
          />
        </div>
        <button onClick={opslaan} disabled={opslaanBezig} style={btn(colors.campfire)}>
          {opslaanBezig ? 'Bezig…' : gekoppeld ? 'Corrigeren' : 'Opslaan'}
        </button>
        {gekoppeld && (
          <button onClick={verwijderen} style={btn(colors.stamp)}>
            Ontkoppelen
          </button>
        )}
      </div>
      {foutmelding && (
        <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.stamp, marginTop: 6 }}>{foutmelding}</p>
      )}
    </div>
  );
}

const inputStyle = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: radius.input,
  border: `1px solid ${colors.line}`,
  background: colors.white,
  fontFamily: fonts.body,
  fontSize: 13,
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
