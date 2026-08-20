import { useEffect, useState } from 'react';
import Head from 'next/head';
import { PhotoTagFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/fotos', label: 'Overzicht', exact: true },
  { href: '/beheer/fotos/toevoegen', label: "+ Foto's toevoegen" },
  { href: '/beheer/fotos/tags', label: 'Tags' },
];

export default function FotoTagsPage() {
  return (
    <RequireAuth>
      <FotoTagsContent />
    </RequireAuth>
  );
}

function FotoTagsContent() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nieuweNaam, setNieuweNaam] = useState('');
  const [toevoegBezig, setToevoegBezig] = useState(false);
  const [fout, setFout] = useState(null);
  const [bewerkId, setBewerkId] = useState(null);
  const [bewerkNaam, setBewerkNaam] = useState('');

  const load = async () => {
    setLoading(true);
    setTags(await PhotoTagFactory.getAll());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleToevoegen = async () => {
    setFout(null);
    if (!nieuweNaam.trim()) {
      setFout('Vul een naam voor de tag in.');
      return;
    }
    if (tags.some((t) => t.naam.toLowerCase() === nieuweNaam.trim().toLowerCase())) {
      setFout('Deze tag bestaat al.');
      return;
    }
    setToevoegBezig(true);
    try {
      await PhotoTagFactory.create(nieuweNaam.trim());
      setNieuweNaam('');
      load();
    } finally {
      setToevoegBezig(false);
    }
  };

  const startBewerken = (tag) => {
    setBewerkId(tag.id);
    setBewerkNaam(tag.naam);
  };

  const opslaanBewerking = async () => {
    if (!bewerkNaam.trim()) return;
    await PhotoTagFactory.update(bewerkId, bewerkNaam.trim());
    setBewerkId(null);
    load();
  };

  const handleVerwijderen = async (tag) => {
    if (!confirm(`Tag "${tag.naam}" verwijderen? Foto's die deze tag hadden, verliezen 'm dan gewoon.`)) return;
    await PhotoTagFactory.remove(tag.id);
    load();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Foto-tags — Beheer</title>
      </Head>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Foto's
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Tags beheren
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 20 }}>
          Enkel jij als beheerder maakt nieuwe categorieën aan — zo blijft de
          lijst overzichtelijk. Iedereen mag daarna wel bestaande tags aan
          een foto toekennen, in het beheer én op de publieke fotopagina.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
            type="text"
            value={nieuweNaam}
            onChange={(e) => setNieuweNaam(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleToevoegen()}
            placeholder="bv. Kampvuur, Groepsfoto, Zwemmen…"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleToevoegen} disabled={toevoegBezig} style={btn(colors.forest)}>
            {toevoegBezig ? 'Bezig…' : '+ Toevoegen'}
          </button>
        </div>
        {fout && <div style={{ color: colors.stamp, fontFamily: fonts.body, fontSize: 13, marginTop: -14, marginBottom: 16 }}>{fout}</div>}

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tags.map((tag) => (
            <div
              key={tag.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: colors.paperCard,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.card,
              }}
            >
              {bewerkId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={bewerkNaam}
                    onChange={(e) => setBewerkNaam(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && opslaanBewerking()}
                    style={{ ...inputStyle, flex: 1 }}
                    autoFocus
                  />
                  <button onClick={opslaanBewerking} style={btn(colors.forest)}>
                    Opslaan
                  </button>
                  <button onClick={() => setBewerkId(null)} style={btn(colors.inkMuted)}>
                    Annuleren
                  </button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink, fontWeight: 600 }}>
                    {tag.naam}
                  </span>
                  <button onClick={() => startBewerken(tag)} style={btn(colors.inkMuted)}>
                    Bewerken
                  </button>
                  <button onClick={() => handleVerwijderen(tag)} style={btn(colors.stamp)}>
                    Verwijderen
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {!loading && tags.length === 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Nog geen tags aangemaakt.</p>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '9px 12px',
  borderRadius: radius.input,
  border: `1px solid ${colors.line}`,
  background: colors.white,
  fontFamily: fonts.body,
  fontSize: 14,
  color: colors.ink,
  boxSizing: 'border-box',
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
  };
}
