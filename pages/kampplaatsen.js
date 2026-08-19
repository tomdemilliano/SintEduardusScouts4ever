import { useEffect, useState } from 'react';
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
          <div style={{ marginBottom: 12, border: `1px solid ${colors.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
            <CampMap pins={pins} />
          </div>
        )}

        {!loading && pins.length > 0 && (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32, fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
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
          ❤️ De leukste kampplaatsen (uit de vriendenboekjes)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {groepen.map((groep) => (
            <div
              key={groep.label}
              style={{
                background: colors.paperCard,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.card,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: fonts.display, fontSize: 19, fontWeight: 600, color: colors.ink }}>
                  {groep.label}
                </span>
                <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.campfire }}>
                  ❤️ {groep.entries.length}×
                </span>
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 4 }}>
                {groep.entries.map((e) => e.naam).join(', ')}
              </div>
            </div>
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
              📍 Extra getipte plekken
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {extraLocaties.map((loc) => (
                <div
                  key={loc.id}
                  style={{
                    background: colors.paperCard,
                    border: `1px solid ${colors.line}`,
                    borderRadius: radius.card,
                    padding: '16px 18px',
                  }}
                >
                  <span style={{ fontFamily: fonts.display, fontSize: 19, fontWeight: 600, color: colors.ink }}>
                    {loc.naam}
                  </span>
                  {loc.beschrijving && (
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 4 }}>
                      {loc.beschrijving}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
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
