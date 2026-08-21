import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import 'leaflet/dist/leaflet.css';
import Decorations from '../components/Decorations';
import { StatsFactory } from '../lib/dbSchema';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Enkel publieke pagina's tellen als bezoek -- het beheergedeelte is
    // jouw eigen gebruik, geen "bezoekersverkeer".
    if (!router.pathname.startsWith('/beheer')) {
      StatsFactory.logBezoek(router.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style jsx global>{`
        html,
        body {
          background-color: #f3ecda;
          background-image:
            radial-gradient(circle at 20% 15%, rgba(62, 91, 69, 0.05), transparent 40%),
            radial-gradient(circle at 85% 75%, rgba(193, 101, 29, 0.06), transparent 45%),
            repeating-radial-gradient(circle at 50% 50%, rgba(44, 36, 25, 0.015) 0, rgba(44, 36, 25, 0.015) 1px, transparent 1px, transparent 3px);
        }
      `}</style>
      <Decorations />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
