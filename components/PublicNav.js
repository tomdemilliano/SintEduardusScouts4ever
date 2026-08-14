import Link from 'next/link';
import { useRouter } from 'next/router';
import { colors, fonts } from '../lib/theme';

const LINKS = [
  { href: '/vriendenboekje', label: 'Vriendenboekje', icon: '📖' },
  { href: '/tijdlijn', label: 'Tijdlijn', icon: '⏳' },
  { href: '/kampplaatsen', label: 'Kampplaatsen', icon: '🏕️' },
  { href: '/eten', label: 'Eten', icon: '🍲' },
  { href: '/spellen', label: 'Spellen', icon: '🎲' },
  { href: '/links', label: 'Links', icon: '🔗' },
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

function SiteHeader() {
  return (
    <div style={{ textAlign: 'center', paddingTop: 24 }}>
      <img
        src="/logo-header.png"
        alt="Vrienden van Sint-Eduardusscouts — voor oud-scouts en sympathisanten"
        style={{ display: 'inline-block', width: '100%', maxWidth: 420, height: 'auto' }}
      />
    </div>
  );
}

/**
 * De losse rij navigatieknoppen, herbruikbaar los van de header — bv. op de
 * landingspagina, die de header/logo al op zijn eigen, grotere manier toont.
 */
export function NavButtons({ style }) {
  const router = useRouter();

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '18px 20px 0',
        ...style,
      }}
    >
      <Link href="/" aria-label="Naar de homepagina" style={{ display: 'flex', marginRight: 4 }}>
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
  );
}

/** Header (logo) + navigatieknoppen samen — gebruikt op alle pagina's behalve de landingspagina. */
export default function PublicNav() {
  return (
    <div>
      <SiteHeader />
      <NavButtons />
    </div>
  );
}
