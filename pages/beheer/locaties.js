import { useEffect, useState } from 'react';
import Head from 'next/head';
import { EntryFactory, LocationFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import { groupByField } from '../../lib/utils';
import RequireAuth from '../../components/RequireAuth';

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
  const [zoekResultaten, setZoekResultaten] = useState({}); // per label
  const [zoekend, setZoekend] = useState(null);

  const load = async () => {
    setLoading(true);
    const [entries, locs] = await Promise.all([EntryFactory.getAll(), LocationFactory.getAll()]);
    setGroepen(groupByField(entries, 'besteKampplaats'));
    const byId = {};
    locs.forEach((l) => (byId[l.id] = l));
    setLocaties(byId);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const zoekLocatie = async (label) => {
    setZoekend(label);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(label)}`
      );
      const data = await res.json();
      setZoekResultaten((prev) => ({ ...prev, [label]: data }));
    } catch (e) {
      setZoekResultaten((prev) => ({ ...prev, [label]: [] }));
    } finally {
      setZoekend(null);
    }
  };

  const kiesResultaat = async (label, result) => {
    await LocationFactory.set(label, parseFloat(result.lat), parseFloat(result.lon));
    setZoekResultaten((prev) => ({ ...prev, [label]: null }));
    load();
  };

  const verwijderLocatie = async (label) => {
    await LocationFactory.remove(label);
    load();
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.paper }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Kampplaatsen koppelen — Beheer</title>
      </Head>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 20px 80px' }}>
        <a href="/beheer" style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textDecoration: 'none' }}>
          ← Terug naar overzicht
        </a>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '12px 0 6px' }}>
          Kampplaatsen op de kaart
        </h1>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 28 }}>
          Zoek elke kampplaats op en kies het juiste resultaat om ze een pin op de
          kaart te geven. Plaatsen zonder coördinaten verschijnen gewoon niet op de kaart.
        </p>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groepen.map((groep) => {
            const gekoppeld = locaties[groep.label.trim().toLowerCase()];
            const resultaten = zoekResultaten[groep.label];
            return (
              <div
                key={groep.label}
                style={{
                  background: colors.paperCard,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.card,
                  padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, color: colors.ink }}>
                      {groep.label}
                    </div>
                    <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
                      {groep.entries.length}× vermeld
                      {gekoppeld && ` · gekoppeld aan ${gekoppeld.lat.toFixed(3)}, ${gekoppeld.lng.toFixed(3)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => zoekLocatie(groep.label)} style={btn(colors.forest)}>
                      {zoekend === groep.label ? 'Bezig…' : gekoppeld ? 'Opnieuw zoeken' : 'Zoeken'}
                    </button>
                    {gekoppeld && (
                      <button onClick={() => verwijderLocatie(groep.label)} style={btn(colors.stamp)}>
                        Ontkoppelen
                      </button>
                    )}
                  </div>
                </div>

                {resultaten && resultaten.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {resultaten.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => kiesResultaat(groep.label, r)}
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
                    Geen resultaten gevonden.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function btn(color) {
  return {
    padding: '7px 14px',
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
