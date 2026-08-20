import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PhotoFactory, PhotoTagFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import PublicNav from '../components/PublicNav';
import TagFilterPicker from '../components/TagFilterPicker';

export default function FotosPage() {
  const [fotos, setFotos] = useState([]);
  const [alleTags, setAlleTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jaarFilter, setJaarFilter] = useState('alle');
  const [locatieFilter, setLocatieFilter] = useState('alle');
  const [tagFilter, setTagFilter] = useState([]);
  const [ledenZoek, setLedenZoek] = useState('');
  const [enkelOngetagd, setEnkelOngetagd] = useState(false);

  useEffect(() => {
    Promise.all([PhotoFactory.getPublished(), PhotoTagFactory.getAll()]).then(([f, t]) => {
      setFotos(f);
      setAlleTags(t);
      setLoading(false);
    });
  }, []);

  const jaren = useMemo(
    () => [...new Set(fotos.map((f) => f.jaar).filter(Boolean))].sort((a, b) => b - a),
    [fotos]
  );
  const locaties = useMemo(
    () => [...new Set(fotos.map((f) => f.locatie).filter(Boolean))].sort(),
    [fotos]
  );

  const toggleTag = (id) => {
    setTagFilter((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const gefilterd = fotos.filter((f) => {
    if (jaarFilter !== 'alle' && f.jaar !== parseInt(jaarFilter, 10)) return false;
    if (locatieFilter !== 'alle' && f.locatie !== locatieFilter) return false;
    if (tagFilter.length > 0 && !tagFilter.every((t) => (f.tagIds || []).includes(t))) return false;
    if (ledenZoek.trim()) {
      const term = ledenZoek.trim().toLowerCase();
      if (!(f.ledenTags || []).some((t) => t.naam.toLowerCase().includes(term))) return false;
    }
    if (enkelOngetagd) {
      const ongetagd = !f.jaar && !f.locatie && (!f.ledenTags || f.ledenTags.length === 0);
      if (!ongetagd) return false;
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Foto's — Vrienden van Sint-Eduardusscouts</title>
      </Head>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 16px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Foto's
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted, margin: 0 }}>
            Help mee sorteren! Klik op een foto om er een jaar, locatie of naam bij te zetten.
          </p>
          <Link
            href="/foto-toevoegen"
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
            📷 Heb je zelf foto's om te delen? Voeg ze toe →
          </Link>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
        )}

        {!loading && (
          <div className="vb-fotos-layout">
            {/* Categorieën — altijd zichtbaar op grotere schermen, links; op mobiel via het knopje bij de filters */}
            {alleTags.length > 0 && (
              <aside className="vb-tag-sidebar">
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: colors.inkMuted,
                    marginBottom: 10,
                  }}
                >
                  Categorieën
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <SidebarItem actief={tagFilter.length === 0} onClick={() => setTagFilter([])}>
                    Alle foto's
                  </SidebarItem>
                  {alleTags.map((tag) => (
                    <SidebarItem key={tag.id} actief={tagFilter.includes(tag.id)} onClick={() => toggleTag(tag.id)}>
                      {tag.naam}
                    </SidebarItem>
                  ))}
                </div>
              </aside>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                <select value={jaarFilter} onChange={(e) => setJaarFilter(e.target.value)} style={selectStyle}>
                  <option value="alle">Alle jaren</option>
                  {jaren.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
                <select value={locatieFilter} onChange={(e) => setLocatieFilter(e.target.value)} style={selectStyle}>
                  <option value="alle">Alle locaties</option>
                  {locaties.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                {alleTags.length > 0 && (
                  <div className="vb-tag-mobile-btn">
                    <TagFilterPicker alleTags={alleTags} geselecteerd={tagFilter} onChange={setTagFilter} />
                  </div>
                )}
                <input
                  type="text"
                  value={ledenZoek}
                  onChange={(e) => setLedenZoek(e.target.value)}
                  placeholder="Zoek op naam…"
                  style={{ ...selectStyle, minWidth: 160 }}
                />
                <button
                  onClick={() => setEnkelOngetagd((v) => !v)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: radius.badge,
                    border: `1.5px solid ${enkelOngetagd ? colors.campfire : colors.line}`,
                    background: enkelOngetagd ? colors.campfire : colors.white,
                    color: enkelOngetagd ? colors.white : colors.ink,
                    fontFamily: fonts.body,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🏷️ Nog niet getagd
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 12,
                }}
              >
                {gefilterd.map((foto) => (
                  <FotoKaart key={foto.id} foto={foto} alleTags={alleTags} />
                ))}
              </div>

              {gefilterd.length === 0 && (
                <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
                  Geen foto's die aan deze filters voldoen.
                </p>
              )}
            </div>
          </div>
        )}

        <style jsx>{`
          .vb-fotos-layout {
            display: flex;
            gap: 28px;
            align-items: flex-start;
          }
          .vb-tag-sidebar {
            width: 170px;
            flex-shrink: 0;
          }
          .vb-tag-mobile-btn {
            display: none;
          }
          @media (max-width: 680px) {
            .vb-tag-sidebar {
              display: none;
            }
            .vb-tag-mobile-btn {
              display: block;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function SidebarItem({ children, actief, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '7px 12px',
        borderRadius: radius.input,
        border: 'none',
        background: actief ? colors.forest : 'transparent',
        color: actief ? colors.white : colors.ink,
        fontFamily: fonts.body,
        fontSize: 13,
        fontWeight: actief ? 700 : 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function FotoKaart({ foto, alleTags }) {
  const [fout, setFout] = useState(false);
  const getagd = foto.jaar || foto.locatie || (foto.ledenTags && foto.ledenTags.length > 0);
  const tagNamen = (foto.tagIds || [])
    .map((id) => alleTags.find((t) => t.id === id)?.naam)
    .filter(Boolean);

  return (
    <Link href={`/fotos/${foto.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          border: `1px solid ${colors.line}`,
          borderRadius: radius.card,
          overflow: 'hidden',
          background: colors.paperCard,
          position: 'relative',
        }}
      >
        {fout ? (
          <div
            style={{
              aspectRatio: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 22 }}>🖼️</span>
            <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted }}>
              Kan niet getoond worden — klik om te bekijken
            </span>
          </div>
        ) : (
          <img
            src={foto.afbeeldingUrl}
            alt=""
            onError={() => setFout(true)}
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
          />
        )}
        {!getagd && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              fontFamily: fonts.body,
              fontSize: 10,
              fontWeight: 700,
              color: colors.white,
              background: colors.campfire,
              borderRadius: radius.badge,
              padding: '2px 8px',
            }}
          >
            nog niet getagd
          </span>
        )}
        {(foto.jaar || foto.locatie) && (
          <div style={{ padding: '6px 8px 2px', fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted }}>
            {[foto.jaar, foto.locatie].filter(Boolean).join(' · ')}
          </div>
        )}
        {tagNamen.length > 0 && (
          <div style={{ padding: '0 8px 6px', fontFamily: fonts.body, fontSize: 10, color: colors.forest, fontWeight: 600 }}>
            {tagNamen.join(' · ')}
          </div>
        )}
      </div>
    </Link>
  );
}

const selectStyle = {
  padding: '8px 12px',
  borderRadius: radius.input,
  border: `1px solid ${colors.line}`,
  background: colors.white,
  fontFamily: fonts.body,
  fontSize: 13,
  color: colors.ink,
};
