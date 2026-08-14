import { useEffect, useState } from 'react';
import Head from 'next/head';
import { EntryFactory, DishFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import { groupByArrayField } from '../../lib/utils';
import RequireAuth from '../../components/RequireAuth';

export default function GerechtenPage() {
  return (
    <RequireAuth>
      <GerechtenContent />
    </RequireAuth>
  );
}

function GerechtenContent() {
  const [groepen, setGroepen] = useState([]);
  const [recepten, setRecepten] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [entries, dishes] = await Promise.all([EntryFactory.getAll(), DishFactory.getAll()]);
    setGroepen(groupByArrayField(entries, 'lekkersteEten'));
    const byId = {};
    dishes.forEach((d) => (byId[d.id] = d));
    setRecepten(byId);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Gerechten &amp; recepten — Beheer</title>
      </Head>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
        <a href="/beheer" style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textDecoration: 'none' }}>
          ← Terug naar overzicht
        </a>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '12px 0 6px' }}>
          Gerechten &amp; recepten
        </h1>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 28 }}>
          Koppel eventueel een recept aan een gerecht. Op de publieke pagina
          wordt dat gerecht dan klikbaar.
        </p>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groepen.map((groep) => (
            <DishCard
              key={groep.label}
              groep={groep}
              recept={recepten[groep.label.trim().toLowerCase()]}
              onChanged={load}
            />
          ))}
        </div>

        {!loading && groepen.length === 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>
            Nog geen gerechten ingevuld.
          </p>
        )}
      </div>
    </div>
  );
}

function DishCard({ groep, recept, onChanged }) {
  const [receptUrl, setReceptUrl] = useState(recept?.receptUrl || '');
  const [receptNotitie, setReceptNotitie] = useState(recept?.receptNotitie || '');
  const [bezig, setBezig] = useState(false);

  const opslaan = async () => {
    setBezig(true);
    try {
      await DishFactory.set(groep.label, { receptUrl: receptUrl.trim(), receptNotitie: receptNotitie.trim() });
      onChanged();
    } finally {
      setBezig(false);
    }
  };

  const verwijderKoppeling = async () => {
    await DishFactory.remove(groep.label);
    setReceptUrl('');
    setReceptNotitie('');
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
        </div>
      </div>
      <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginTop: 2, marginBottom: 12 }}>
        {groep.entries.map((e) => e.naam).join(', ')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          value={receptUrl}
          onChange={(e) => setReceptUrl(e.target.value)}
          placeholder="https://... (link naar een recept)"
          style={inputStyle}
        />
        <input
          type="text"
          value={receptNotitie}
          onChange={(e) => setReceptNotitie(e.target.value)}
          placeholder="Korte notitie (optioneel, bv. 'Mama's recept')"
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={opslaan} disabled={bezig} style={btn(colors.forest)}>
            {bezig ? 'Bezig…' : 'Opslaan'}
          </button>
          {recept && (
            <button onClick={verwijderKoppeling} style={btn(colors.stamp)}>
              Ontkoppelen
            </button>
          )}
        </div>
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
  fontSize: 13,
  color: colors.ink,
  boxSizing: 'border-box',
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
  };
}
