import Link from 'next/link';
import { useRouter } from 'next/router';
import { colors, fonts } from '../lib/theme';

const LINKS = [
  { href: '/', label: 'Vriendenboekje', icon: '📖' },
  { href: '/tijdlijn', label: 'Tijdlijn', icon: '⏳' },
  { href: '/kampplaatsen', label: 'Kampplaatsen', icon: '🏕️' },
  { href: '/eten', label: 'Eten', icon: '🍲' },
  { href: '/spellen', label: 'Spellen', icon: '🎲' },
];

// Lichtjes scheve hoeken en rotaties, per knop verschillend maar altijd
// dezelfde volgorde (geen Math.random — anders klopt server- en
// client-render niet met elkaar, wat een hydration-fout geeft in Next.js).
const RADIUS = [
  '16px 22px 18px 24px / 20px 16px 22px 14px',
  '22px 16px 24px 18px / 16px 22px 14px 20px',
  '18px 24px 16px 22px / 22px 14px 20px 16px',
  '24px 18px 22px 16px / 14px 20px 16px 22px',
  '20px 14px 22px 18px / 18px 24px 16px 20px',
];
const ROTATIE = [-1.5, 1, -1, 1.5, -0.5];

function Kampvuurtje() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" style={{ flexShrink: 0 }}>
      <path d="M6 24 L14 12" stroke={colors.forestDark} strokeWidth="2" strokeLinecap="round" />
      <path d="M24 24 L16 12" stroke={colors.forestDark} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M15 9 C 11 13, 11 17, 15 21 C 19 17, 19 13, 15 9 Z"
        fill={colors.campfire}
      />
      <path
        d="M15 13 C 13 15.5, 13 17.5, 15 19.5 C 17 17.5, 17 15.5, 15 13 Z"
        fill="#F4B860"
      />
    </svg>
  );
}

// Een gestileerde sjorpoort: twee palen met een dwarsbalk, op elke hoek
// vastgesjord met een kruisende touwwikkeling — een klassieke scouts
// pionierconstructie, als decoratieve poort boven de sitetitel.
function SjorPoort() {
  const lashing = (x) => (
    <g stroke={colors.rope} strokeWidth="2.5" strokeLinecap="round">
      <line x1={x - 20} y1="8" x2={x + 20} y2="30" />
      <line x1={x + 20} y1="8" x2={x - 20} y2="30" />
      <line x1={x - 20} y1="15" x2={x + 20} y2="23" />
      <line x1={x + 20} y1="15" x2={x - 20} y2="23" />
      <line x1={x - 20} y1="9" x2={x + 20} y2="9" strokeWidth="2" opacity="0.7" />
      <line x1={x - 20} y1="29" x2={x + 20} y2="29" strokeWidth="2" opacity="0.7" />
    </g>
  );

  return (
    <svg
      width="100%"
      height="72"
      viewBox="0 0 600 90"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}
    >
      {/* palen */}
      <line x1="60" y1="14" x2="60" y2="86" stroke={colors.wood} strokeWidth="11" strokeLinecap="round" />
      <line x1="540" y1="14" x2="540" y2="86" stroke={colors.wood} strokeWidth="11" strokeLinecap="round" />
      {/* dwarsbalk */}
      <line x1="45" y1="19" x2="555" y2="19" stroke={colors.wood} strokeWidth="10" strokeLinecap="round" />
      {/* sjorringen op de twee hoeken */}
      {lashing(60)}
      {lashing(540)}
      {/* vlaggetje in het midden */}
      <line x1="300" y1="19" x2="300" y2="48" stroke={colors.wood} strokeWidth="3" strokeLinecap="round" />
      <path d="M300 21 L334 30 L300 39 Z" fill={colors.campfire} />
    </svg>
  );
}

function SiteHeader() {
  return (
    <div style={{ textAlign: 'center', paddingTop: 24 }}>
      <SjorPoort />
      <h1
        style={{
          fontFamily: fonts.display,
          fontSize: 28,
          fontWeight: 700,
          color: colors.ink,
          margin: '2px 0 0',
          letterSpacing: '0.01em',
        }}
      >
        Vrienden van Sint Eduardusscouts
      </h1>
    </div>
  );
}

export default function PublicNav() {
  const router = useRouter();

  return (
    <div>
      <SiteHeader />
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '18px 20px 0',
        }}
      >
        <Link href="/" aria-label="Naar het vriendenboekje" style={{ display: 'flex', marginRight: 4 }}>
          <Kampvuurtje />
        </Link>

        {LINKS.map((link, i) => {
          const active = router.pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="vb-nav-link"
              style={{
                padding: '7px 16px',
                borderRadius: RADIUS[i % RADIUS.length],
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                color: active ? colors.white : colors.ink,
                background: active ? colors.forest : colors.paperCard,
                border: `1.5px solid ${active ? colors.forest : colors.line}`,
                transform: `rotate(${ROTATIE[i % ROTATIE.length]}deg)`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}

        <style jsx>{`
          .vb-nav-link {
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .vb-nav-link:hover {
            transform: rotate(0deg) scale(1.05) !important;
            box-shadow: 0 3px 8px rgba(44, 36, 25, 0.12);
          }
        `}</style>
      </div>
    </div>
  );
}
