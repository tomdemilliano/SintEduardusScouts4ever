import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { PhotoFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import { decenniumLabel } from '../../../lib/utils';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/fotos', label: 'Overzicht', exact: true },
  { href: '/beheer/fotos/toevoegen', label: "+ Foto's toevoegen" },
  { href: '/beheer/fotos/tags', label: 'Tags' },
  { href: '/beheer/fotos/sorteren', label: '🗓️ Op decennium sorteren' },
  { href: '/beheer/fotos/dubbels', label: '🔍 Dubbels' },
];

const STARTDECENNIUM = 1940;

function alleDecennia() {
  const eind = Math.floor(new Date().getFullYear() / 10) * 10;
  const lijst = [];
  for (let d = STARTDECENNIUM; d <= eind; d += 10) lijst.push(d);
  return lijst;
}

export default function SorterenPage() {
  return (
    <RequireAuth>
      <SorterenContent />
    </RequireAuth>
  );
}

function SorterenContent() {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null); // welk decennium is uitgeklapt
  const [lijstOpen, setLijstOpen] = useState([]); // lokale, herschikbare volgorde van het open decennium
  const dragIndexRef = useRef(null);

  const load = async () => {
    setLoading(true);
    const alle = await PhotoFactory.getAllAdmin();
    setFotos(alle.filter((f) => f.status === 'published' && !f.verwijderVerzoek));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (open == null) {
      setLijstOpen([]);
      return;
    }
    const inDecennium = fotos
      .filter((f) => f.decennium === open)
      .sort((a, b) => (a.decenniumPositie || 0) - (b.decenniumPositie || 0));
    setLijstOpen(inDecennium);
  }, [open, fotos]);

  const nietGesorteerd = fotos.filter((f) => f.decennium == null);

  const handleDropOpDecennium = async (decennium, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    await PhotoFactory.zetDecennium(id, decennium);
    load();
  };

  const startSlepenUitLijst = (index) => {
    dragIndexRef.current = index;
  };

  const overAndereFoto = (index) => {
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    const nieuw = [...lijstOpen];
    const [verplaatst] = nieuw.splice(dragIndexRef.current, 1);
    nieuw.splice(index, 0, verplaatst);
    dragIndexRef.current = index;
    setLijstOpen(nieuw);
  };

  const eindeSlepen = async () => {
    dragIndexRef.current = null;
    await PhotoFactory.herschikDecennium(lijstOpen.map((f) => f.id));
    load();
  };

  const verwijderDecennium = async (id) => {
    await PhotoFactory.zetDecennium(id, null);
    load();
  };

  const verplaatsNaarDecennium = async (id, decennium) => {
    await PhotoFactory.zetDecennium(id, decennium);
    load();
  };

  const zetJaar = async (foto, jaarStr) => {
    const jaar = jaarStr ? parseInt(jaarStr, 10) : null;
    await PhotoFactory.updateTags(foto.id, {
      jaar,
      locatie: foto.locatie,
      beschrijving: foto.beschrijving,
      ledenTags: foto.ledenTags,
      tagIds: foto.tagIds,
      decennium: foto.decennium,
    });
    load();
  };

  const decennia = alleDecennia();

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Op decennium sorteren — Beheer</title>
      </Head>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 100px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Foto's
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Op decennium sorteren
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 24 }}>
          Sleep een foto naar een decennium als je geen exact jaartal weet.
          Klik op een decennium om het uit te klappen en de foto's er
          binnenin te herschikken (vooraan = vroeger in dat decennium) — zo
          ontstaat toch een soort tijdlijn, ook zonder exact jaartal.
        </p>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        {!loading && (
          <>
            {/* Niet-gesorteerde foto's */}
            <div style={{ marginBottom: 20 }}>
              <SectieTitel>Nog niet gesorteerd ({nietGesorteerd.length})</SectieTitel>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                {nietGesorteerd.map((foto) => (
                  <img
                    key={foto.id}
                    src={foto.afbeeldingUrl}
                    alt=""
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', foto.id)}
                    style={{
                      width: 70,
                      height: 70,
                      objectFit: 'cover',
                      borderRadius: radius.input,
                      border: `1px solid ${colors.line}`,
                      flexShrink: 0,
                      cursor: 'grab',
                    }}
                  />
                ))}
                {nietGesorteerd.length === 0 && (
                  <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
                    Alles is ondertussen aan een decennium toegewezen. 🎉
                  </p>
                )}
              </div>
            </div>

            {/* Decennium-vakken */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {decennia.map((d) => {
                const aantal = fotos.filter((f) => f.decennium === d).length;
                const actief = open === d;
                return (
                  <button
                    key={d}
                    onClick={() => setOpen(actief ? null : d)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOpDecennium(d, e)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: radius.card,
                      border: `2px dashed ${actief ? colors.forest : colors.line}`,
                      background: actief ? colors.forest : colors.paperCard,
                      color: actief ? colors.white : colors.ink,
                      fontFamily: fonts.display,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      minWidth: 110,
                    }}
                  >
                    {decenniumLabel(d)}
                    <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                      {aantal} foto{aantal === 1 ? '' : "'s"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Uitgeklapt decennium */}
            {open != null && (
              <div style={{ background: colors.paperCard, border: `1.5px solid ${colors.forest}`, borderRadius: radius.card, padding: '18px 20px' }}>
                <SectieTitel>{decenniumLabel(open)} — sleep om te herschikken</SectieTitel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {lijstOpen.map((foto, index) => (
                    <div
                      key={foto.id}
                      draggable
                      onDragStart={() => startSlepenUitLijst(index)}
                      onDragEnter={() => overAndereFoto(index)}
                      onDragEnd={eindeSlepen}
                      onDragOver={(e) => e.preventDefault()}
                      style={{
                        width: 110,
                        background: colors.white,
                        border: `1px solid ${colors.line}`,
                        borderRadius: radius.card,
                        overflow: 'hidden',
                        cursor: 'grab',
                      }}
                    >
                      <img src={foto.afbeeldingUrl} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input
                          type="number"
                          placeholder="exact jaar?"
                          defaultValue={foto.jaar || ''}
                          onBlur={(e) => {
                            if (parseInt(e.target.value, 10) !== (foto.jaar || null)) zetJaar(foto, e.target.value);
                          }}
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            borderRadius: 4,
                            border: `1px solid ${colors.line}`,
                            fontFamily: fonts.body,
                            fontSize: 11,
                            boxSizing: 'border-box',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                          <button
                            title="Naar vorig decennium"
                            onClick={() => verplaatsNaarDecennium(foto.id, open - 10)}
                            disabled={open <= STARTDECENNIUM}
                            style={miniBtn()}
                          >
                            ◀
                          </button>
                          <button title="Decennium verwijderen" onClick={() => verwijderDecennium(foto.id)} style={miniBtn(colors.stamp)}>
                            ✕
                          </button>
                          <button title="Naar volgend decennium" onClick={() => verplaatsNaarDecennium(foto.id, open + 10)} style={miniBtn()}>
                            ▶
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {lijstOpen.length === 0 && (
                  <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
                    Nog geen foto's in dit decennium — sleep er hierboven eentje naartoe.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectieTitel({ children }) {
  return (
    <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkMuted, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function miniBtn(kleur) {
  return {
    flex: 1,
    padding: '4px 0',
    borderRadius: 4,
    border: 'none',
    background: kleur || colors.inkMuted,
    color: colors.white,
    fontSize: 11,
    cursor: 'pointer',
  };
}
