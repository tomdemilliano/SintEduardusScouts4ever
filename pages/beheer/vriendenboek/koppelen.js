import { useEffect, useState } from 'react';
import Head from 'next/head';
import { EntryFactory, PhotoFactory, TakFactory, LeidingFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import { werkingsjaarLabel } from '../../../lib/utils';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/vriendenboek', label: 'Overzicht', exact: true },
  { href: '/beheer/vriendenboek/upload', label: '+ Eén scan' },
  { href: '/beheer/vriendenboek/bulk-upload', label: '+ Meerdere scans' },
  { href: '/beheer/vriendenboek/koppelen', label: '🔗 Niet-gekoppelde tags' },
];

export default function KoppelenPage() {
  return (
    <RequireAuth>
      <KoppelenContent />
    </RequireAuth>
  );
}

function KoppelenContent() {
  const [loading, setLoading] = useState(true);
  const [namen, setNamen] = useState([]); // [{ naam, fotoRefs: [{id}], leidingRefs: [{id}], alleLeden }]
  const [alleLeden, setAlleLeden] = useState([]);
  const [bezigVoor, setBezigVoor] = useState(null);
  const [perOngelukGepubliceerd, setPerOngelukGepubliceerd] = useState([]);
  const [terugzetBezig, setTerugzetBezig] = useState(false);

  /**
   * Een gepubliceerde entry die op een leeggebleven stub lijkt: alle
   * vriendenboekje-specifieke velden staan nog leeg, en er is geen scan.
   * Zo herkennen we entries die per ongeluk in bulk gepubliceerd werden.
   */
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
    const [fotos, leiding, leden, takken, alleEntries] = await Promise.all([
      PhotoFactory.getAllAdmin(),
      LeidingFactory.getAll(),
      EntryFactory.getSearchable(),
      TakFactory.getAll(),
      EntryFactory.getAll(),
    ]);
    setAlleLeden(leden);
    setPerOngelukGepubliceerd(alleEntries.filter(lijktOpPerOngelukGepubliceerdeStub));

    const map = {}; // genormaliseerde naam -> { naam, fotoRefs, leidingRefs }
    fotos.forEach((foto) => {
      (foto.ledenTags || []).forEach((tag) => {
        if (tag.entryId) return; // al gekoppeld
        const key = tag.naam.trim().toLowerCase();
        if (!key) return;
        if (!map[key]) map[key] = { naam: tag.naam, fotoRefs: [], leidingRefs: [] };
        map[key].fotoRefs.push({ id: foto.id });
      });
    });
    leiding.forEach((item) => {
      (item.leden || []).forEach((lid) => {
        if (lid.entryId) return;
        const key = lid.naam.trim().toLowerCase();
        if (!key) return;
        if (!map[key]) map[key] = { naam: lid.naam, fotoRefs: [], leidingRefs: [] };
        const takNaam = takken.find((t) => t.id === item.takId)?.naam || '(onbekende tak)';
        map[key].leidingRefs.push({ id: item.id, takId: item.takId, werkingsjaarStart: item.werkingsjaarStart, takNaam });
      });
    });

    setNamen(
      Object.values(map).sort(
        (a, b) => b.fotoRefs.length + b.leidingRefs.length - (a.fotoRefs.length + a.leidingRefs.length)
      )
    );
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

  const koppelAan = async (item, entryId) => {
    setBezigVoor(item.naam);
    try {
      await Promise.all([
        ...item.fotoRefs.map((f) => PhotoFactory.linkLedenTagNaam(f.id, item.naam, entryId)),
        ...item.leidingRefs.map((l) => LeidingFactory.linkLedenNaam(l.id, item.naam, entryId)),
      ]);
      await scan();
    } finally {
      setBezigVoor(null);
    }
  };

  const maakStubEnKoppel = async (item) => {
    setBezigVoor(item.naam);
    try {
      const entryId = await EntryFactory.findOrCreateStub(item.naam);
      await koppelAan(item, entryId);
    } finally {
      setBezigVoor(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Niet-gekoppelde tags — Beheer</title>
      </Head>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Vriendenboek
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Niet-gekoppelde tags opruimen
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 20 }}>
          Namen die vrij ingetypt werden op foto's of leidingsploegen vóór
          er automatisch een fiche voor werd aangemaakt. Koppel elke naam
          aan een bestaand lid (als die er al is onder een licht andere
          schrijfwijze) of maak er een nieuwe stub-fiche van — dat past
          meteen alle foto's/leidingsploegen met die naam aan.
        </p>

        {!loading && perOngelukGepubliceerd.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.stamp }}>
                Lijkt op per ongeluk gepubliceerd ({perOngelukGepubliceerd.length})
              </div>
              <button onClick={zetAllesTerug} disabled={terugzetBezig} style={btn(colors.stamp)}>
                {terugzetBezig ? 'Bezig…' : `Alles (${perOngelukGepubliceerd.length}) terugzetten`}
              </button>
            </div>
            <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginBottom: 12 }}>
              Deze fiches zijn gepubliceerd, maar hebben geen enkel
              vriendenboekje-veld ingevuld (geen geboortejaar, totemnaam,
              periode, activiteiten, kampplaats, eten of scan) — waarschijnlijk
              stub-fiches die per ongeluk mee gepubliceerd werden.
            </p>
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
          </div>
        )}

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met scannen…</p>}

        {!loading && namen.length === 0 && (
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
            🎉 Alle getagde namen zijn al gekoppeld aan een fiche.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {namen.map((item) => (
            <RijNaam
              key={item.naam}
              item={item}
              alleLeden={alleLeden}
              bezig={bezigVoor === item.naam}
              onKoppel={(entryId) => koppelAan(item, entryId)}
              onMaakStub={() => maakStubEnKoppel(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RijNaam({ item, alleLeden, bezig, onKoppel, onMaakStub }) {
  const [zoekOpen, setZoekOpen] = useState(false);
  const [zoekterm, setZoekterm] = useState('');

  const suggesties = zoekterm.trim()
    ? alleLeden.filter((e) => e.naam.toLowerCase().includes(zoekterm.trim().toLowerCase())).slice(0, 6)
    : [];

  return (
    <div
      style={{
        background: colors.paperCard,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.card,
        padding: '14px 18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, color: colors.ink }}>{item.naam}</div>
          <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
            {item.fotoRefs.length > 0 && `📷 ${item.fotoRefs.length} foto${item.fotoRefs.length === 1 ? '' : "'s"}`}
            {item.fotoRefs.length > 0 && item.leidingRefs.length > 0 && ' · '}
            {item.leidingRefs.length > 0 &&
              `👥 ${item.leidingRefs
                .map((l) => `${l.takNaam} ${werkingsjaarLabel(l.werkingsjaarStart)}`)
                .join(', ')}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setZoekOpen((v) => !v)} disabled={bezig} style={btn(colors.inkMuted)}>
            Koppel aan bestaand lid
          </button>
          <button onClick={onMaakStub} disabled={bezig} style={btn(colors.forest)}>
            {bezig ? 'Bezig…' : '+ Nieuwe stub-fiche'}
          </button>
        </div>
      </div>

      {zoekOpen && (
        <div style={{ marginTop: 10 }}>
          <input
            type="text"
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            placeholder="Zoek een bestaand lid…"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: radius.input,
              border: `1px solid ${colors.line}`,
              background: colors.white,
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.ink,
              boxSizing: 'border-box',
            }}
          />
          {suggesties.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {suggesties.map((lid) => (
                <button
                  key={lid.id}
                  onClick={() => {
                    onKoppel(lid.id);
                    setZoekOpen(false);
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: radius.badge,
                    border: `1px solid ${colors.line}`,
                    background: colors.white,
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: colors.ink,
                    cursor: 'pointer',
                  }}
                >
                  {lid.naam}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
