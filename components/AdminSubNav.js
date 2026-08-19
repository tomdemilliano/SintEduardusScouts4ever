import Link from 'next/link';
import { useRouter } from 'next/router';
import { colors, fonts } from '../lib/theme';

/** tabs: [{ href, label, exact? }] */
export default function AdminSubNav({ tabs }) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const actief = tab.exact ? router.pathname === tab.href : router.pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '7px 16px',
              borderRadius: 999,
              border: `1.5px solid ${actief ? colors.forest : colors.line}`,
              background: actief ? colors.forest : colors.white,
              color: actief ? colors.white : colors.ink,
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
