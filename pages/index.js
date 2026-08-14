import Head from 'next/head';
import Link from 'next/link';
import { colors, fonts, fontImports } from '../lib/theme';
import { NavButtons } from '../components/PublicNav';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Vrienden van Sint-Eduardusscouts</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 20px 100px', textAlign: 'center' }}>
        <img
          src="/logo-header.png"
          alt="Vrienden van Sint-Eduardusscouts — voor oud-scouts en sympathisanten"
          style={{ display: 'inline-block', width: '100%', maxWidth: 520, height: 'auto' }}
        />

        <p
          style={{
            fontFamily: fonts.body,
            fontSize: 16,
            color: colors.ink,
            lineHeight: 1.6,
            maxWidth: 520,
            margin: '32px auto 0',
          }}
        >
          Deze website is er voor oud-leden van Sint-Eduardusscouts. We maakten
          een overzicht van alle leden, het lekkerste kampeten, de tofste
          spelletjes en de beste kamplocaties door de jaren heen. Sta jij er
          nog niet tussen?{' '}
          <Link href="/toevoegen" style={{ color: colors.forest, fontWeight: 600 }}>
            Voeg dan gerust ook jouw eigen herinneringen toe
          </Link>
          .
        </p>

        <NavButtons style={{ marginTop: 36, paddingTop: 0 }} />
      </div>
    </div>
  );
}
