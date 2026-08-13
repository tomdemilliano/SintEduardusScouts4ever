import { useEffect, useState } from 'react';
import Head from 'next/head';
import { EntryFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports } from '../lib/theme';
import { wordFrequencies } from '../lib/utils';
import PublicNav from '../components/PublicNav';

const KLEUREN = [colors.forest, colors.campfire, colors.stamp, colors.forestDark];

export default function EtenPage() {
  const [woorden, setWoorden] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EntryFactory.getPublished().then((entries) => {
      const freq = wordFrequencies(entries.map((e) => e.lekkersteEten), 2);
      setWoorden(freq.slice(0, 60));
      setLoading(false);
    });
  }, []);

  const max = woorden[0]?.aantal || 1;
  const min = woorden[woorden.length - 1]?.aantal || 1;

  const fontSizeFor = (aantal) => {
    if (max === min) return 26;
    const t = (aantal - min) / (max - min);
    return 15 + t * 42; // 15px .. 57px
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
            Hoe vaker genoemd, hoe groter het woord
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
            gap: '4px 18px',
            padding: '20px 10px',
          }}
        >
          {woorden.map((w, i) => (
            <span
              key={w.tekst}
              style={{
                fontFamily: fonts.display,
                fontWeight: 600,
                fontSize: fontSizeFor(w.aantal),
                color: KLEUREN[i % KLEUREN.length],
                lineHeight: 1.1,
              }}
              title={`${w.aantal}× genoemd`}
            >
              {w.tekst}
            </span>
          ))}
        </div>

        {!loading && woorden.length === 0 && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>
            Nog niet genoeg data om een woordenwolk te tonen.
          </p>
        )}
      </div>
    </div>
  );
}
