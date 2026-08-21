import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { StatsFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import RequireAuth from '../../components/RequireAuth';

export default function StatistiekenPage() {
  return (
    <RequireAuth>
      <StatistiekenContent />
    </RequireAuth>
  );
}

function laatsteDagen(n) {
  const dagen = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dagen.push(d.toISOString().slice(0, 10));
  }
  return dagen;
}

function StatistiekenContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StatsFactory.getAll().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const totaalAllerTijden = useMemo(() => data.reduce((som, r) => som + (r.aantal || 0), 0), [data]);

  const dagen30 = useMemo(() => laatsteDagen(30), []);
  const perDag = useMemo(() => {
    const map = {};
    dagen30.forEach((d) => (map[d] = 0));
    data.forEach((r) => {
      if (map[r.dag] !== undefined) map[r.dag] += r.aantal || 0;
    });
    return dagen30.map((d) => ({ dag: d, aantal: map[d] }));
  }, [data, dagen30]);

  const totaal30 = useMemo(() => perDag.reduce((s, r) => s + r.aantal, 0), [perDag]);
  const maxPerDag = Math.max(1, ...perDag.map((r) => r.aantal));

  const topPaginas = useMemo(() => {
    const map = {};
    data.forEach((r) => {
      map[r.pad] = (map[r.pad] || 0) + (r.aantal || 0);
    });
    return Object.entries(map)
      .map(([pad, aantal]) => ({ pad, aantal }))
      .sort((a, b) => b.aantal - a.aantal)
      .slice(0, 10);
  }, [data]);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Statistieken — Beheer</title>
      </Head>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Bezoekerstatistieken
        </h1>
        <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginBottom: 24 }}>
          Enkel het aantal paginabezoeken per dag wordt geteld — geen
          individuele bezoekers of IP-adressen.
        </p>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        {!loading && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
              <StatKaart label="Bezoeken (30 dagen)" waarde={totaal30} />
              <StatKaart label="Bezoeken (all-time)" waarde={totaalAllerTijden} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <SectieTitel>Per dag (laatste 30 dagen)</SectieTitel>
              <div
                style={{
                  background: colors.paperCard,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.card,
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 3,
                  height: 140,
                }}
              >
                {perDag.map((r) => (
                  <div
                    key={r.dag}
                    title={`${r.dag}: ${r.aantal} bezoek${r.aantal === 1 ? '' : 'en'}`}
                    style={{
                      flex: 1,
                      height: `${Math.max((r.aantal / maxPerDag) * 100, r.aantal > 0 ? 4 : 1)}%`,
                      background: r.aantal > 0 ? colors.forest : colors.line,
                      borderRadius: '2px 2px 0 0',
                      minWidth: 2,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, marginTop: 4 }}>
                <span>{dagen30[0]}</span>
                <span>{dagen30[dagen30.length - 1]}</span>
              </div>
            </div>

            <div>
              <SectieTitel>Meest bezochte pagina's</SectieTitel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topPaginas.map((r) => (
                  <div
                    key={r.pad}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '9px 14px',
                      background: colors.paperCard,
                      border: `1px solid ${colors.line}`,
                      borderRadius: radius.card,
                      fontFamily: fonts.body,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: colors.ink, fontWeight: 600 }}>{r.pad}</span>
                    <span style={{ color: colors.forest, fontWeight: 700 }}>{r.aantal}</span>
                  </div>
                ))}
              </div>
              {topPaginas.length === 0 && (
                <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Nog geen data.</p>
              )}
            </div>
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

function StatKaart({ label, waarde }) {
  return (
    <div style={{ background: colors.paperCard, border: `1px solid ${colors.line}`, borderRadius: radius.card, padding: '16px 14px' }}>
      <div style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.ink }}>{waarde}</div>
      <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>{label}</div>
    </div>
  );
}
