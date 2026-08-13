import Link from 'next/link';
import { useRouter } from 'next/router';
import { colors, fonts } from '../lib/theme';

const LINKS = [
  { href: '/', label: 'Vriendenboekje' },
  { href: '/tijdlijn', label: 'Tijdlijn' },
  { href: '/kampplaatsen', label: 'Kampplaatsen' },
  { href: '/eten', label: 'Eten' },
  { href: '/spellen', label: 'Spellen' },
  { href: '/toevoegen', label: 'Zelf toevoegen' },
];

export default function PublicNav() {
  const router = useRouter();

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '18px 20px 0',
      }}
    >
      {LINKS.map((link) => {
        const active = router.pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              color: active ? colors.white : colors.inkMuted,
              background: active ? colors.forest : 'transparent',
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
