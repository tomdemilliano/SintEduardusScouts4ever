import { useEffect, useState } from 'react';
import Head from 'next/head';
import { EntryFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import { groupByArrayField } from '../lib/utils';
import PublicNav from '../components/PublicNav';

export default function SpellenPage() {
  const [groepen, setGroepen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EntryFactory.getPublished().then((entries) => {
      setGroepen(groupByArrayField(entries, 'leuksteActiviteit'));
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Leukste spelen — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 32px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            De plezantste spelen
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted }}>
            (en de strafste activiteiten)
          </p>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontFamily: fonts.display, fontSize: 19, fontWeight: 600, color: colors.ink }}>
                  {groep.label}
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 3 }}>
                  {groep.entries.map((e) => e.naam).join(', ')}
                </div>
              </div>
              {groep.entries.length > 1 && (
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.white,
                    background: colors.campfire,
                    borderRadius: radius.badge,
                    padding: '4px 10px',
                  }}
                >
                  {groep.entries.length}×
                </span>
              )}
            </div>
          ))}
        </div>

        {!loading && groepen.length === 0 && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
            Nog geen spelen ingevuld.
          </p>
        )}
      </div>
    </div>
  );
}
