import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { EntryFactory, LocationFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import { groupByArrayField } from '../lib/utils';
import PublicNav from '../components/PublicNav';

const CampMap = dynamic(() => import('../components/CampMap'), { ssr: false });

export default function KampplaatsenPage() {
  const [groepen, setGroepen] = useState([]);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([EntryFactory.getPublished(), LocationFactory.getAll()]).then(
      ([entries, locations]) => {
        const grouped = groupByArrayField(entries, 'besteKampplaats');
        setGroepen(grouped);

        const locByNorm = {};
        locations.forEach((loc) => {
          locByNorm[loc.id] = loc;
        });

        const gevondenPins = grouped
          .map((g) => {
            const loc = locByNorm[g.label.trim().toLowerCase()];
            if (!loc) return null;
            return { naam: g.label, lat: loc.lat, lng: loc.lng, count: g.entries.length };
          })
          .filter(Boolean);

        setPins(gevondenPins);
        setLoading(false);
      }
    );
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Kampplaatsen — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 32px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            De beste kampplaatsen
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted }}>
            Wat iedereen als beste kampplaats ooit opgaf
          </p>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
        )}

        {!loading && pins.length > 0 && (
          <div style={{ marginBottom: 32, border: `1px solid ${colors.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
            <CampMap pins={pins} />
          </div>
        )}

        {!loading && groepen.length > 0 && pins.length === 0 && (
          <div
            style={{
              marginBottom: 32,
              border: `1px dashed ${colors.line}`,
              borderRadius: radius.card,
              padding: '24px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, margin: 0 }}>
              Er zijn nog geen kampplaatsen aan de kaart gekoppeld.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groepen.map((groep) => (
            <div
              key={groep.label}
              style={{
                background: colors.paperCard,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.card,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: fonts.display, fontSize: 19, fontWeight: 600, color: colors.ink }}>
                  {groep.label}
                </span>
                <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.campfire }}>
                  {groep.entries.length}×
                </span>
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 4 }}>
                {groep.entries.map((e) => e.naam).join(', ')}
              </div>
            </div>
          ))}
        </div>

        {!loading && groepen.length === 0 && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
            Nog geen kampplaatsen ingevuld.
          </p>
        )}
      </div>
    </div>
  );
}
