import { useEffect, useState } from 'react';
import Head from 'next/head';
import { EntryFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/vriendenboek', label: 'Overzicht', exact: true },
  { href: '/beheer/vriendenboek/upload', label: '+ Eén scan' },
  { href: '/beheer/vriendenboek/bulk-upload', label: '+ Meerdere scans' },
  { href: '/beheer/vriendenboek/wijzigingen', label: '✏️ Wijzigingsvoorstellen' },
];

export default function KoppelenPage() {
  return (
    <RequireAuth>
      <KoppelenContent />
    </RequireAuth>
  );
}

/**
 * Deze pagina is bewust niet meer aan een tabblad gekoppeld: sinds
 * MemberTagPicker altijd een entry-ID toekent (bestaand lid of nieuwe
 * stub-fiche), kunnen er geen niet-gekoppelde tags meer ontstaan. Enkel
 * de opruimtool voor per-ongeluk-gepubliceerde stub-fiches blijft over,
 * als vangnet — rechtstreeks bereikbaar via deze URL.
 */
function KoppelenContent() {
  const [loading, setLoading] = useState(true);
  const [perOngelukGepubliceerd, setPerOngelukGepubliceerd] = useState([]);
  const [terugzetBezig, setTerugzetBezig] = useState(false);

  const lijktOpPerOngelukGepubliceerdeStub = (e) =>
    e.status === 'published' &&
    !e.geboortejaar &&
    !e.totemnaam &&
    !e.periode &&
    !e.scanUrl &&
    (e.leuksteActiviteit || []).length === 0 &&
    (e.besteKampplaats || []).length === 0 &&
    (e.lekkersteEten || []).length === 0;

  const scan = async () => {
    setLoading(true);
    const alleEntries = await EntryFactory.getAll();
    setPerOngelukGepubliceerd(alleEntries.filter(lijktOpPerOngelukGepubliceerdeStub));
    setLoading(false);
  };

  useEffect(() => {
    scan();
  }, []);

  const zetEenTerug = async (id) => {
    await EntryFactory.revertToStub(id);
    await scan();
  };

  const zetAllesTerug = async () => {
    if (!confirm(`${perOngelukGepubliceerd.length} fiche(s) terugzetten naar "getagd, geen fiche"?`)) return;
    setTerugzetBezig(true);
    try {
      await Promise.all(perOngelukGepubliceerd.map((e) => EntryFactory.revertToStub(e.id)));
      await scan();
    } finally {
      setTerugzetBezig(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Per ongeluk gepubliceerd — Beheer</title>
      </Head>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Vriendenboek
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Per ongeluk gepubliceerde stub-fiches
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 24 }}>
          Vangnet-tool: herkent gepubliceerde entries die op een leeggebleven
          stub lijken (geen geboortejaar, totemnaam, periode, activiteiten,
          kampplaats, eten of scan) en zet ze desgewenst terug naar
          "getagd, geen eigen fiche".
        </p>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met scannen…</p>}

        {!loading && perOngelukGepubliceerd.length === 0 && (
          <div
            style={{
              background: colors.paperCard,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.card,
              padding: '18px 20px',
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.forest,
              fontWeight: 600,
            }}
          >
            🎉 Geen verdachte fiches gevonden.
          </div>
        )}

        {!loading && perOngelukGepubliceerd.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button onClick={zetAllesTerug} disabled={terugzetBezig} style={btn(colors.stamp)}>
                {terugzetBezig ? 'Bezig…' : `Alles (${perOngelukGepubliceerd.length}) terugzetten`}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {perOngelukGepubliceerd.map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: colors.campfireLight,
                    border: `1.5px dashed ${colors.campfire}`,
                    borderRadius: radius.card,
                  }}
                >
                  <span style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 600, color: colors.ink }}>{e.naam}</span>
                  <button onClick={() => zetEenTerug(e.id)} style={btn(colors.stamp)}>
                    Terugzetten
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
