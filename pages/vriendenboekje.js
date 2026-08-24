import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory, PhotoFactory, LeidingFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import PublicNav from '../components/PublicNav';

export default function VriendenboekjePage() {
  const [entries, setEntries] = useState([]);
  const [stubs, setStubs] = useState([]);
  const [fotoAantallen, setFotoAantallen] = useState({});
  const [leidingAantallen, setLeidingAantallen] = useState({});
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState('');
  const [tab, setTab] = useState('leden'); // leden | getagd

  useEffect(() => {
    Promise.all([
      EntryFactory.getPublished(),
      EntryFactory.getStubs(),
      PhotoFactory.getPublished(),
      LeidingFactory.getAll(),
    ]).then(([e, stubLijst, fotos, leiding]) => {
      setEntries(e);
      setStubs(stubLijst);

      const fotoTellingen = {};
      fotos.forEach((foto) => {
        (foto.taggedEntryIds || []).forEach((entryId) => {
          fotoTellingen[entryId] = (fotoTellingen[entryId] || 0) + 1;
        });
      });
      setFotoAantallen(fotoTellingen);

      const leidingTellingen = {};
      leiding.forEach((item) => {
        (item.leden || []).forEach((lid) => {
          if (lid.entryId) leidingTellingen[lid.entryId] = (leidingTellingen[lid.entryId] || 0) + 1;
        });
      });
      setLeidingAantallen(leidingTellingen);

      setLoading(false);
    });
  }, []);

  const gefilterd = entries.filter((e) =>
    `${e.naam} ${e.totemnaam}`.toLowerCase().includes(zoek.toLowerCase())
  );
  const stubsGefilterd = stubs.filter((e) => e.naam.toLowerCase().includes(zoek.toLowerCase()));

  // Onthoud de zichtbare volgorde (id + naam, zodat de detailpagina de
  // naam van vorige/volgende meteen kan tonen zonder extra op te vragen),
  // zodat de profielpagina van een lid ermee kan navigeren.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('vb-leden-volgorde', JSON.stringify(gefilterd.map((e) => ({ id: e.id, naam: e.naam }))));
    } catch (e) {
      // sessionStorage niet beschikbaar (bv. privénavigatie) — geen probleem,
      // de detailpagina toont dan gewoon geen vorige/volgende-navigatie.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gefilterd]);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Overzicht — Vrienden van Sint-Eduardusscouts</title>
      </Head>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />
        <div style={{ textAlign: 'center', marginBottom: 24, marginTop: 28 }}>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 48,
              fontWeight: 700,
              color: colors.ink,
              margin: '0 0 10px',
            }}
          >
            Het Vriendenboekje
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 16, color: colors.inkMuted, maxWidth: 480, margin: '0 auto' }}>
            Herinneringen, totemnamen en de beste kampverhalen van iedereen die meedeed.
          </p>
        </div>

        {/* Tabbladen */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          <TabKnop actief={tab === 'leden'} onClick={() => setTab('leden')}>
            Leden ({entries.length})
          </TabKnop>
          <TabKnop actief={tab === 'getagd'} onClick={() => setTab('getagd')}>
            Getagd, geen eigen fiche ({stubs.length})
          </TabKnop>
        </div>

        <input
          type="text"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek op naam of totemnaam…"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: 360,
            margin: '0 auto 36px',
            padding: '10px 14px',
            borderRadius: radius.badge,
            border: `1px solid ${colors.line}`,
            background: colors.white,
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.ink,
            boxSizing: 'border-box',
          }}
        />

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
            Bezig met laden…
          </p>
        )}

        {!loading && tab === 'leden' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 18,
              }}
            >
              <Link href="/toevoegen" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: colors.campfireLight,
                    border: `1.5px dashed ${colors.campfire}`,
                    borderRadius: radius.card,
                    padding: '22px 20px',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 8 }}>✍️</div>
                  <div style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 700, color: colors.campfire, lineHeight: 1.3 }}>
                    Was jij lid maar sta hier nog niet tussen?
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 6, lineHeight: 1.4 }}>
                    Klik dan hier om jouw ervaringen toe te voegen.
                  </div>
                </div>
              </Link>

              {gefilterd.map((entry) => (
                <Link key={entry.id} href={`/entry/${entry.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      position: 'relative',
                      background: colors.paperCard,
                      border: `1px solid ${colors.line}`,
                      borderRadius: radius.card,
                      padding: '22px 20px',
                      height: '100%',
                      boxSizing: 'border-box',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {entry.geboortejaar && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          fontFamily: fonts.body,
                          fontSize: 11,
                          fontWeight: 600,
                          color: colors.inkMuted,
                          border: `1px solid ${colors.line}`,
                          borderRadius: radius.badge,
                          padding: '3px 8px',
                        }}
                      >
                        °{entry.geboortejaar}
                      </div>
                    )}
                    <div style={{ fontFamily: fonts.display, fontSize: 21, fontWeight: 600, color: colors.ink, marginBottom: 6, paddingRight: 40 }}>
                      {entry.naam}
                    </div>
                    {entry.totemnaam && (
                      <div
                        style={{
                          display: 'inline-block',
                          fontFamily: fonts.body,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: colors.stamp,
                          border: `1.5px solid ${colors.stamp}`,
                          borderRadius: radius.badge,
                          padding: '3px 10px',
                          marginBottom: 10,
                          transform: 'rotate(-2deg)',
                        }}
                      >
                        {entry.totemnaam}
                      </div>
                    )}
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>
                      {entry.periode}
                    </div>
                    {fotoAantallen[entry.id] > 0 && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 8,
                          fontFamily: fonts.body,
                          fontSize: 12,
                          fontWeight: 600,
                          color: colors.forest,
                        }}
                      >
                        📷 {fotoAantallen[entry.id]}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {!loading && gefilterd.length === 0 && (
              <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
                Geen resultaten gevonden.
              </p>
            )}
          </>
        )}

        {!loading && tab === 'getagd' && (
          <>
            <p style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginBottom: 20, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Deze mensen zijn herkend op een foto of stonden in een
              leidingsploeg, maar vulden nog geen eigen vriendenboekje-
              formulier in.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 500, margin: '0 auto' }}>
              {stubsGefilterd.map((entry) => (
                <Link key={entry.id} href={`/entry/${entry.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      background: colors.paperCard,
                      border: `1px solid ${colors.line}`,
                      borderRadius: radius.card,
                    }}
                  >
                    <span style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, color: colors.ink }}>
                      {entry.naam}
                    </span>
                    <span style={{ display: 'flex', gap: 10, fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.forest }}>
                      {fotoAantallen[entry.id] > 0 && <span>📷 {fotoAantallen[entry.id]}</span>}
                      {leidingAantallen[entry.id] > 0 && <span>👥 {leidingAantallen[entry.id]}</span>}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {stubsGefilterd.length === 0 && (
              <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
                {zoek ? 'Geen resultaten gevonden.' : 'Niemand hier op dit moment.'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabKnop({ children, actief, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 18px',
        borderRadius: radius.badge,
        border: `1.5px solid ${actief ? colors.forest : colors.line}`,
        background: actief ? colors.forest : colors.white,
        color: actief ? colors.white : colors.ink,
        fontFamily: fonts.body,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
