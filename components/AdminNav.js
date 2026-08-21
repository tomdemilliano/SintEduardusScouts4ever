import Link from 'next/link';
import { useRouter } from 'next/router';
import { colors, fonts } from '../lib/theme';

const SECTIES = [
  { href: '/beheer', label: 'Dashboard', icon: '🏠', match: (p) => p === '/beheer' },
  { href: '/beheer/vriendenboek', label: 'Vriendenboek', icon: '📖', match: (p) => p.startsWith('/beheer/vriendenboek') },
  { href: '/beheer/tijdlijn', label: 'Tijdlijn', icon: '⏳', match: (p) => p.startsWith('/beheer/tijdlijn') },
  { href: '/beheer/kampplaatsen', label: 'Kampplaatsen', icon: '📍', match: (p) => p.startsWith('/beheer/kampplaatsen') },
  { href: '/beheer/fotos', label: "Foto's", icon: '📷', match: (p) => p.startsWith('/beheer/fotos') },
  { href: '/beheer/gerechten', label: 'Gerechten', icon: '🍽️', match: (p) => p.startsWith('/beheer/gerechten') },
  { href: '/beheer/links', label: 'Links', icon: '🔗', match: (p) => p.startsWith('/beheer/links') },
  { href: '/beheer/statistieken', label: 'Statistieken', icon: '📊', match: (p) => p.startsWith('/beheer/statistieken') },
];

export default function AdminNav() {
  const router = useRouter();

  return (
    <div style={{ background: colors.forestDark }}>
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {SECTIES.map((sectie) => {
          const actief = sectie.match(router.pathname);
          return (
            <Link
              key={sectie.href}
              href={sectie.href}
              style={{
                padding: '12px 14px',
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: actief ? colors.white : 'rgba(255,255,255,0.65)',
                borderBottom: actief ? `2px solid ${colors.campfire}` : '2px solid transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {sectie.icon} {sectie.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
