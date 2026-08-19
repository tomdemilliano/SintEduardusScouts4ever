import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory, LocationFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import { toTextArray } from '../../../lib/utils';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

export default function VriendenboekPage() {
  return (
    <RequireAuth>
      <VriendenboekContent />
    </RequireAuth>
  );
}

const TABS = [
  { href: '/beheer/vriendenboek', label: 'Overzicht', exact: true },
  { href: '/beheer/vriendenboek/upload', label: '+ Eén scan' },
  { href: '/beheer/vriendenboek/bulk-upload', label: '+ Meerdere scans' },
];

function VriendenboekContent() {
  const [entries, setEntries] = useState([]);
  const [gekoppeldeLocaties, setGekoppeldeLocaties] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('alle'); // alle | draft | published
  const [kampplaatsFilter, setKampplaatsFilter] = useState('alle'); // alle | niet-gekoppeld

  const load = async () => {
    setLoading(true);
    const [all, locaties] = await Promise.all([EntryFactory.getAll(), LocationFactory.getAll()]);
    setEntries(all);
    setGekoppeldeLocaties(new Set(locaties.map((l) => l.id))); // l.id = genormaliseerde naam
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePublish = async (id) => {
    await EntryFactory.publish(id);
    load();
  };

  const handleUnpublish = async (id) => {
    await EntryFactory.unpublish(id);
    load();
  };

  const handleDelete = async (entry) => {
    if (!confirm(`"${entry.naam}" definitief verwijderen?`)) return;
    await EntryFactory.remove(entry.id, entry.scanPath);
    load();
  };

  /**
   * Geeft de koppelstatus van de kampplaatsen van een entry terug:
   * 'geen' (niets ingevuld), 'volledig' (alles gekoppeld), 'deels' of 'niet'.
   */
  const kampplaatsStatus = (entry) => {
    const plaatsen = toTextArray(entry.besteKampplaats).filter(Boolean);
    if (plaatsen.length === 0) return { type: 'geen', linked: 0, total: 0 };
    const linked = plaatsen.filter((p) => gekoppeldeLocaties.has(p.trim().toLowerCase())).length;
    if (linked === plaatsen.length) return { type: 'volledig', linked, total: plaatsen.length };
    if (linked === 0) return { type: 'niet', linked, total: plaatsen.length };
    return { type: 'deels', linked, total: plaatsen.length };
  };

  const gefilterd = useMemo(() => {
    return entries.filter((entry) => {
      if (statusFilter !== 'alle' && entry.status !== statusFilter) return false;
      if (kampplaatsFilter === 'niet-gekoppeld') {
        const { type } = kampplaatsStatus(entry);
        if (type !== 'niet' && type !== 'deels') return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, statusFilter, kampplaatsFilter, gekoppeldeLocaties]);

  const aantalDraft = entries.filter((e) => e.status !== 'published').length;
  const aantalNietGekoppeld = entries.filter((e) => {
    const { type } = kampplaatsStatus(e);
    return type === 'niet' || type === 'deels';
  }).length;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Vriendenboek — Beheer</title>
      </Head>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 4px' }}>
          Vriendenboek
        </h1>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, margin: '0 0 20px' }}>
          {entries.length} formulier{entries.length === 1 ? '' : 'en'} ·{' '}
          {entries.filter((e) => e.status === 'published').length} gepubliceerd
        </p>

        <AdminSubNav tabs={TABS} />

        {/* Filters */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          <FilterGroup label="Status">
            <FilterButton active={statusFilter === 'alle'} onClick={() => setStatusFilter('alle')}>
              Alle
            </FilterButton>
            <FilterButton active={statusFilter === 'draft'} onClick={() => setStatusFilter('draft')}>
              Concepten {aantalDraft > 0 && `(${aantalDraft})`}
            </FilterButton>
            <FilterButton active={statusFilter === 'published'} onClick={() => setStatusFilter('published')}>
              Gepubliceerd
            </FilterButton>
          </FilterGroup>

          <FilterGroup label="Kampplaats">
            <FilterButton active={kampplaatsFilter === 'alle'} onClick={() => setKampplaatsFilter('alle')}>
              Alle
            </FilterButton>
            <FilterButton
              active={kampplaatsFilter === 'niet-gekoppeld'}
              onClick={() => setKampplaatsFilter('niet-gekoppeld')}
            >
              Niet gekoppeld {aantalNietGekoppeld > 0 && `(${aantalNietGekoppeld})`}
            </FilterButton>
          </FilterGroup>
        </div>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {gefilterd.map((entry) => {
            const kampplaatsInfo = kampplaatsStatus(entry);
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 18px',
                  background: colors.paperCard,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.card,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 600, color: colors.ink }}>
                    {entry.naam || '(naamloos)'}{' '}
                    <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 400, color: colors.inkMuted }}>
                      {entry.totemnaam && `— ${entry.totemnaam}`}
                    </span>
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginTop: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>{entry.periode || 'periode onbekend'}</span>
                    <span style={{ color: entry.status === 'published' ? colors.forest : colors.campfire, fontWeight: 600 }}>
                      {entry.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                    </span>
                    <KampplaatsBadge status={kampplaatsInfo} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={`/beheer/vriendenboek/${entry.id}`} style={btnStyleOutline}>
                    Bewerken
                  </Link>
                  {entry.status === 'published' ? (
                    <button onClick={() => handleUnpublish(entry.id)} style={btnStyle(colors.inkMuted)}>
                      Depubliceren
                    </button>
                  ) : (
                    <button onClick={() => handlePublish(entry.id)} style={btnStyle(colors.forest)}>
                      Publiceren
                    </button>
                  )}
                  <button onClick={() => handleDelete(entry)} style={btnStyle(colors.stamp)}>
                    Verwijderen
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && gefilterd.length === 0 && entries.length > 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>
            Geen formulieren die aan deze filters voldoen.
          </p>
        )}
        {!loading && entries.length === 0 && (
          <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>
            Nog geen formulieren toegevoegd.
          </p>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.inkMuted, marginRight: 2 }}>
        {label}
      </span>
      {children}
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

function KampplaatsBadge({ status }) {
  if (status.type === 'geen') {
    return <span style={{ color: colors.inkMuted }}>· geen kampplaats ingevuld</span>;
  }
  if (status.type === 'volledig') {
    return (
      <span style={{ color: colors.forest, fontWeight: 600 }}>
        · 📍 gekoppeld{status.total > 1 ? ` (${status.total})` : ''}
      </span>
    );
  }
  if (status.type === 'deels') {
    return (
      <span style={{ color: colors.stamp, fontWeight: 600 }}>
        · ⚠ {status.linked}/{status.total} kampplaatsen gekoppeld
      </span>
    );
  }
  return (
    <span style={{ color: colors.stamp, fontWeight: 600 }}>
      · ⚠ kampplaats{status.total > 1 ? 'en' : ''} niet gekoppeld
    </span>
  );
}

const btnStyleOutline = {
  padding: '7px 14px',
  borderRadius: 999,
  border: `1px solid ${colors.line}`,
  color: colors.ink,
  fontFamily: fonts.body,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: 'none',
};

function btnStyle(color) {
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
  };
}
