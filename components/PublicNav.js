import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { colors, fonts, radius } from '../lib/theme';

const LINKS = [
  { href: '/vriendenboekje', label: 'Vriendenboekje', icon: '📖' },
  { href: '/tijdlijn', label: 'Tijdlijn', icon: '⏳' },
  { href: '/kampplaatsen', label: 'Kampplaatsen', icon: '🏕️' },
  { href: '/fotos', label: "Foto's", icon: '📷' },
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

function Kampvuurtje({ maat = 30 }) {
  return (
    <svg width={maat} height={maat} viewBox="0 0 30 30" style={{ flexShrink: 0 }}>
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
 * Dit is de volledige, "losse knoppen"-weergave — op een klein scherm wordt
 * dit binnen PublicNav vervangen door een compacte balk met uitklapmenu
 * (zie hieronder), maar deze losse export blijft bruikbaar waar gewenst.
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

/**
 * Vast, klein icoontje rechtsboven in beeld (blijft ook zichtbaar bij het
 * scrollen) — vervangt de vroegere, tekst-link onderaan de navigatie, die
 * op mobiel onnodig veel plaats innam.
 */
export function ContactLink() {
  return (
    <Link
      href="/contact"
      title="Contacteer de websitebeheerder"
      aria-label="Contacteer de websitebeheerder"
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 50,
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: colors.paperCard,
        border: `1.5px solid ${colors.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        textDecoration: 'none',
        boxShadow: '0 2px 6px rgba(44, 36, 25, 0.12)',
      }}
    >
      ✉️
    </Link>
  );
}

/** Header (logo) + navigatieknoppen samen — gebruikt op alle pagina's behalve de landingspagina. */
export default function PublicNav() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sluit = () => setMenuOpen(false);
    router.events.on('routeChangeStart', sluit);
    return () => router.events.off('routeChangeStart', sluit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <ContactLink />

      {/* Volledige weergave — vanaf een breder scherm */}
      <div className="vb-nav-groot">
        <SiteHeader />
        <NavButtons />
      </div>

      {/* Compacte balk + uitklapmenu — enkel op een smal scherm */}
      <div className="vb-nav-klein">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 44px 12px 16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Kampvuurtje maat={26} />
            <span style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 700, color: colors.ink }}>
              Sint-Eduardusscouts
            </span>
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={menuOpen}
            style={{
              width: 34,
              height: 34,
              borderRadius: radius.input,
              border: `1.5px solid ${colors.line}`,
              background: colors.paperCard,
              fontSize: 16,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {LINKS.map((link) => {
              const active = router.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: radius.input,
                    fontFamily: fonts.body,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: active ? colors.white : colors.ink,
                    background: active ? colors.forest : colors.paperCard,
                    border: `1.5px solid ${active ? colors.forest : colors.line}`,
                  }}
                >
                  <span aria-hidden="true">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        .vb-nav-klein {
          display: none;
        }
        @media (max-width: 680px) {
          .vb-nav-groot {
            display: none;
          }
          .vb-nav-klein {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
