import 'leaflet/dist/leaflet.css';
import Decorations from '../components/Decorations';

export default function App({ Component, pageProps }) {
  return (
    <>
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
