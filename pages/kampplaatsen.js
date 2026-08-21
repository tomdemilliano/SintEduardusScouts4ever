import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory, LocationFactory, ExtraLocationFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import { groupByArrayField } from '../lib/utils';
import PublicNav from '../components/PublicNav';

const CampMap = dynamic(() => import('../components/CampMap'), { ssr: false });

export default function KampplaatsenPage() {
  const [groepen, setGroepen] = useState([]);
  const [extraLocaties, setExtraLocaties] = useState([]);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gemarkeerd, setGemarkeerd] = useState(null);
  const mapWrapperRef = useRef(null);

  useEffect(() => {
    Promise.all([EntryFactory.getPublished(), LocationFactory.getAll(), ExtraLocationFactory.getPublished()]).then(
      ([entries, locations, extra]) => {
        const grouped = groupByArrayField(entries, 'besteKampplaats');
        setGroepen(grouped);
        setExtraLocaties(extra);

        const locByNorm = {};
        locations.forEach((loc) => {
          locByNorm[loc.id] = loc;
        });

        const likePins = grouped
          .map((g) => {
            const loc = locByNorm[g.label.trim().toLowerCase()];
            if (!loc) return null;
            return {
              naam: g.label,
              lat: loc.lat,
              lng: loc.lng,
              kleur: colors.campfire,
              popupHtml: `<strong>${g.label}</strong><br/>❤️ ${g.entries.length}× gekozen als beste kampplaats`,
            };
          })
          .filter(Boolean);

        const extraPins = extra
          .filter((loc) => loc.lat != null && loc.lng != null)
          .map((loc) => ({
            naam: loc.naam,
            lat: loc.lat,
            lng: loc.lng,
            kleur: colors.forest,
            popupHtml: `<strong>${loc.naam}</strong>${loc.beschrijving ? `<br/>${loc.beschrijving}` : ''}`,
          }));

        setPins([...likePins, ...extraPins]);
        setLoading(false);
      }
    );
  }, []);

  const markeer = (naam) => {
    setGemarkeerd((huidige) => (huidige === naam ? null : naam));
    mapWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Kampplaatsen — Vrienden van Sint-Eduardusscouts</title>
      </Head>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 16px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Kampplaatsen
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted, margin: 0 }}>
            De favoriete kampplaatsen uit de vriendenboekjes, aangevuld met extra getipte plekken
          </p>
          <Link
            href="/kampplaats-toevoegen"
            style={{
              display: 'inline-block',
              marginTop: 10,
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: 600,
              color: colors.forest,
              textDecoration: 'none',
            }}
          >
            📍 Ken je nog een toffe kampplaats? Voeg ze toe →
          </Link>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
        )}

        {!loading && pins.length > 0 && (
          <div ref={mapWrapperRef} style={{ marginBottom: 12, border: `1px solid ${colors.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
            <CampMap pins={pins} gemarkeerd={gemarkeerd} />
          </div>
        )}

        {!loading && pins.length > 0 && (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 28, fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
            <span><Dot kleur={colors.campfire} /> Uit de vriendenboekjes (❤️ likes)</span>
            <span><Dot kleur={colors.forest} /> Extra getipte plekken</span>
          </div>
        )}

        {!loading && groepen.length > 0 && pins.length === 0 && (
          <div
            style={{
              marginBottom: 32,
              border: `1px dashed ${colors.line}`,
              borderRadius: radius.card,
              padding: '24px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, margin: 0 }}>
              Er zijn nog geen kampplaatsen aan de kaart gekoppeld.
            </p>
          </div>
        )}

        {/* De "leukste" kampplaatsen — likes uit de vriendenboekjes */}
        <SectieTitel>❤️ De leukste kampplaatsen (uit de vriendenboekjes)</SectieTitel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {groepen.map((groep) => (
            <KampplaatsTegel
              key={groep.label}
              naam={groep.label}
              type="like"
              count={groep.entries.length}
              namen={groep.entries.map((e) => e.naam)}
              actief={gemarkeerd === groep.label}
              onClick={() => markeer(groep.label)}
            />
          ))}
        </div>

        {!loading && groepen.length === 0 && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.inkMuted, marginBottom: 32 }}>
            Nog geen kampplaatsen ingevuld.
          </p>
        )}

        {/* Extra, apart voorgestelde plekken — geen stemmen/likes */}
        {extraLocaties.length > 0 && (
          <>
            <SectieTitel>📍 Extra getipte plekken</SectieTitel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {extraLocaties.map((loc) => (
                <KampplaatsTegel
                  key={loc.id}
                  naam={loc.naam}
                  type="extra"
                  beschrijving={loc.beschrijving}
                  actief={gemarkeerd === loc.naam}
                  onClick={() => markeer(loc.naam)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .vb-kampplek-hart {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .vb-kampplek-tooltip {
          display: none;
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          background: ${colors.ink};
          color: ${colors.paper};
          font-family: ${fonts.body};
          font-size: 12px;
          line-height: 1.6;
          padding: 8px 12px;
          border-radius: ${radius.input};
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(44, 36, 25, 0.25);
        }
        .vb-kampplek-hart:hover .vb-kampplek-tooltip {
          display: block;
        }
      `}</style>
    </div>
  );
}

function SectieTitel({ children }) {
  return (
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: colors.inkMuted,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function KampplaatsTegel({ naam, type, count, namen, beschrijving, actief, onClick }) {
  const kleur = type === 'extra' ? colors.forest : colors.campfire;
  return (
    <button
      onClick={onClick}
      title={beschrijving || undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '9px 14px',
        borderRadius: radius.badge,
        border: `1.5px solid ${actief ? kleur : colors.line}`,
        background: actief ? kleur : colors.paperCard,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 600, color: actief ? colors.white : colors.ink }}>
        {naam}
      </span>
      {type === 'like' ? (
        <span className="vb-kampplek-hart">
          <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: actief ? colors.white : colors.campfire }}>
            ❤️ {count}
          </span>
          {namen && namen.length > 0 && (
            <div className="vb-kampplek-tooltip">
              {namen.map((n, i) => (
                <div key={i}>{n}</div>
              ))}
            </div>
          )}
        </span>
      ) : (
        <span style={{ fontSize: 13 }}>📍</span>
      )}
    </button>
  );
}

function Dot({ kleur }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: kleur,
        marginRight: 5,
        verticalAlign: 'middle',
      }}
    />
  );
}
