import { useEffect, useState } from 'react';
import Head from 'next/head';
import { EntryFactory, DishFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports } from '../lib/theme';
import { groupByArrayField } from '../lib/utils';
import PublicNav from '../components/PublicNav';

const KLEUREN = [colors.forest, colors.campfire, colors.stamp, colors.forestDark];

export default function EtenPage() {
  const [gerechten, setGerechten] = useState([]);
  const [recepten, setRecepten] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([EntryFactory.getPublished(), DishFactory.getAll()]).then(([entries, dishes]) => {
      const grouped = groupByArrayField(entries, 'lekkersteEten');
      setGerechten(grouped);

      const byId = {};
      dishes.forEach((d) => (byId[d.id] = d));
      setRecepten(byId);
      setLoading(false);
    });
  }, []);

  const max = gerechten[0]?.entries.length || 1;
  const min = gerechten[gerechten.length - 1]?.entries.length || 1;

  const fontSizeFor = (aantal) => {
    if (max === min) return 22;
    const t = (aantal - min) / (max - min);
    return 15 + t * 34; // 15px .. 49px
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.paper }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Lekkerste kamp-eten — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 40px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Het lekkerste kamp-eten
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted }}>
            Hoe vaker genoemd, hoe groter het gerecht — klik voor een recept, als er een gekoppeld is
          </p>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: '8px 20px',
            padding: '20px 10px',
          }}
        >
          {gerechten.map((g, i) => {
            const recept = recepten[g.label.trim().toLowerCase()];
            const inhoud = (
              <span
                style={{
                  fontFamily: fonts.display,
                  fontWeight: 600,
                  fontSize: fontSizeFor(g.entries.length),
                  color: KLEUREN[i % KLEUREN.length],
                  lineHeight: 1.2,
                  textDecoration: recept?.receptUrl ? 'underline' : 'none',
                  textDecorationColor: colors.line,
                  textUnderlineOffset: 4,
                }}
                title={`${g.entries.length}× genoemd${recept?.receptNotitie ? ' — ' + recept.receptNotitie : ''}`}
              >
                {g.label}
              </span>
            );
            return recept?.receptUrl ? (
              <a key={g.label} href={recept.receptUrl} target="_blank" rel="noopener noreferrer">
                {inhoud}
              </a>
            ) : (
              <span key={g.label}>{inhoud}</span>
            );
          })}
        </div>

        {!loading && gerechten.length === 0 && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
            Nog niet genoeg data om te tonen.
          </p>
        )}
      </div>
    </div>
  );
}
