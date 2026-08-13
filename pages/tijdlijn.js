import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import { parseStartYear } from '../lib/utils';
import PublicNav from '../components/PublicNav';

export default function TijdlijnPage() {
  const [groepen, setGroepen] = useState([]);
  const [zonderJaar, setZonderJaar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EntryFactory.getPublished().then((entries) => {
      const metJaar = [];
      const geen = [];
      entries.forEach((e) => {
        const jaar = parseStartYear(e.periode);
        if (jaar) metJaar.push({ ...e, startYear: jaar });
        else geen.push(e);
      });

      const byYear = {};
      metJaar.forEach((e) => {
        if (!byYear[e.startYear]) byYear[e.startYear] = [];
        byYear[e.startYear].push(e);
      });

      const sortedGroepen = Object.entries(byYear)
        .map(([jaar, lijst]) => ({ jaar: parseInt(jaar, 10), lijst }))
        .sort((a, b) => a.jaar - b.jaar);

      setGroepen(sortedGroepen);
      setZonderJaar(geen);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: colors.paper }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Tijdlijn — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 44px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Doorheen de jaren
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted }}>
            Op basis van ieders opgegeven ledenperiode
          </p>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
        )}

        <div style={{ position: 'relative', paddingLeft: 28 }}>
          {/* centrale lijn */}
          <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 2, background: colors.line }} />

          {groepen.map((groep) => (
            <div key={groep.jaar} style={{ position: 'relative', marginBottom: 34 }}>
              {/* jaartal-stip */}
              <div
                style={{
                  position: 'absolute',
                  left: -28 + 2,
                  top: 4,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: colors.campfire,
                  border: `3px solid ${colors.paper}`,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: 22,
                  fontWeight: 700,
                  color: colors.forestDark,
                  marginBottom: 10,
                }}
              >
                {groep.jaar}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groep.lijst.map((entry) => (
                  <Link key={entry.id} href={`/entry/${entry.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        background: colors.paperCard,
                        border: `1px solid ${colors.line}`,
                        borderRadius: radius.card,
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600, color: colors.ink }}>
                        {entry.naam}
                      </span>
                      <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
                        {entry.totemnaam && `${entry.totemnaam} · `}
                        {entry.periode}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {zonderJaar.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.inkMuted, marginBottom: 10 }}>
              Periode niet gekend
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {zonderJaar.map((entry) => (
                <Link key={entry.id} href={`/entry/${entry.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: colors.paperCard,
                      border: `1px solid ${colors.line}`,
                      borderRadius: radius.card,
                      padding: '12px 16px',
                      fontFamily: fonts.display,
                      fontSize: 17,
                      fontWeight: 600,
                      color: colors.ink,
                    }}
                  >
                    {entry.naam}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
