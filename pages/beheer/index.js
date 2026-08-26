import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  EntryFactory,
  LocationFactory,
  ExtraLocationFactory,
  MijlpaalFactory,
  KentekenFactory,
  LinkFactory,
  PhotoFactory,
  ContactFactory,
} from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import { toTextArray, huidigWerkingsjaarStart } from '../../lib/utils';
import RequireAuth from '../../components/RequireAuth';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    Promise.all([
      EntryFactory.getAll(),
      LocationFactory.getAll(),
      ExtraLocationFactory.getAllAdmin(),
      MijlpaalFactory.getAllAdmin(),
      KentekenFactory.getAll(),
      LinkFactory.getAll(),
      PhotoFactory.getAllAdmin(),
      ContactFactory.getAll(),
    ]).then(([entries, locaties, extraLocaties, mijlpalen, kentekens, links, fotos, contactBerichten]) => {
      const gepubliceerdeEntries = entries.filter((e) => e.status === 'published');
      const conceptEntries = entries.filter((e) => e.status === 'draft');
      const stubEntries = entries.filter((e) => e.status === 'stub');

      const gekoppeldeLocaties = new Set(locaties.map((l) => l.id));
      const entriesNietGekoppeld = entries.filter((entry) => {
        const plaatsen = toTextArray(entry.besteKampplaats).filter(Boolean);
        if (plaatsen.length === 0) return false;
        return plaatsen.some((p) => !gekoppeldeLocaties.has(p.trim().toLowerCase()));
      });

      const extraPending = extraLocaties.filter((l) => l.status === 'pending');
      const mijlpalenPending = mijlpalen.filter((m) => m.status === 'pending');
      const mijlpalenGepubliceerd = mijlpalen.filter((m) => m.status === 'published');

      const huidigJaar = huidigWerkingsjaarStart();
      const heeftHuidigKenteken = kentekens.some((k) => k.startJaar === huidigJaar);

      const fotosPending = fotos.filter((f) => f.status === 'pending');
      const fotosVerwijderVerzoek = fotos.filter((f) => f.status === 'published' && f.verwijderVerzoek);
      const fotosGepubliceerd = fotos.filter((f) => f.status === 'published');

      setStats({
        entriesTotaal: entries.length,
        entriesGepubliceerd: gepubliceerdeEntries.length,
        entriesConcept: conceptEntries.length,
        entriesStub: stubEntries.length,
        kampplaatsenGekoppeld: locaties.length,
        extraLocatiesGepubliceerd: extraLocaties.filter((l) => l.status === 'published').length,
        mijlpalenGepubliceerd: mijlpalenGepubliceerd.length,
        kentekens: kentekens.length,
        links: links.length,
        fotosGepubliceerd: fotosGepubliceerd.length,
      });

      const lijst = [];
      if (conceptEntries.length > 0) {
        lijst.push({
          href: '/beheer/vriendenboek?status=draft',
          label: `${conceptEntries.length} vriendenboek-formulier${conceptEntries.length === 1 ? '' : 'en'} wachten op publicatie`,
          icon: '📖',
        });
      }
      if (entriesNietGekoppeld.length > 0) {
        lijst.push({
          href: '/beheer/kampplaatsen',
          label: `${entriesNietGekoppeld.length} kampplaats${entriesNietGekoppeld.length === 1 ? '' : 'en'} nog niet (volledig) gekoppeld aan de kaart`,
          icon: '📍',
        });
      }
      if (extraPending.length > 0) {
        lijst.push({
          href: '/beheer/kampplaatsen/extra',
          label: `${extraPending.length} extra kampplaats${extraPending.length === 1 ? '' : 'en'} wachten op goedkeuring`,
          icon: '🗺️',
        });
      }
      if (mijlpalenPending.length > 0) {
        lijst.push({
          href: '/beheer/tijdlijn',
          label: `${mijlpalenPending.length} mijlpaal${mijlpalenPending.length === 1 ? '' : 'en'} wachten op goedkeuring`,
          icon: '🚩',
        });
      }
      if (!heeftHuidigKenteken) {
        lijst.push({
          href: '/beheer/tijdlijn/kentekens',
          label: `Nog geen jaarkenteken voor het huidige werkingsjaar (${huidigJaar}–${huidigJaar + 1})`,
          icon: '🧭',
        });
      }
      if (fotosPending.length > 0) {
        lijst.push({
          href: '/beheer/fotos',
          label: `${fotosPending.length} foto${fotosPending.length === 1 ? '' : "'s"} wachten op goedkeuring`,
          icon: '📷',
        });
      }
      if (fotosVerwijderVerzoek.length > 0) {
        lijst.push({
          href: '/beheer/fotos',
          label: `${fotosVerwijderVerzoek.length} verwijderverzoek${fotosVerwijderVerzoek.length === 1 ? '' : 'en'} voor foto's`,
          icon: '🗑️',
        });
      }
      const ongelezenContact = contactBerichten.filter((b) => !b.gelezen);
      if (ongelezenContact.length > 0) {
        lijst.push({
          href: '/beheer/contact',
          label: `${ongelezenContact.length} nieuw${ongelezenContact.length === 1 ? '' : 'e'} contactbericht${ongelezenContact.length === 1 ? '' : 'en'}`,
          icon: '✉️',
        });
      }
      setTodos(lijst);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Dashboard — Beheer</title>
      </Head>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 24px' }}>
          Dashboard
        </h1>

        {loading && <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>}

        {!loading && stats && (
          <>
            {/* Te behandelen */}
            <div style={{ marginBottom: 32 }}>
              <SectieTitel>Te behandelen</SectieTitel>
              {todos.length === 0 ? (
                <div
                  style={{
                    background: colors.paperCard,
                    border: `1px solid ${colors.line}`,
                    borderRadius: radius.card,
                    padding: '18px 20px',
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: colors.forest,
                    fontWeight: 600,
                  }}
                >
                  🎉 Alles is bijgewerkt — niets wacht op actie.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {todos.map((todo, i) => (
                    <Link key={i} href={todo.href} style={{ textDecoration: 'none' }}>
                      <div
                        style={{
                          background: colors.campfireLight,
                          border: `1.5px solid ${colors.campfire}`,
                          borderRadius: radius.card,
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{todo.icon}</span>
                        <span style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.ink, flex: 1 }}>
                          {todo.label}
                        </span>
                        <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.campfire, fontWeight: 600 }}>
                          Bekijken →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Statistieken */}
            <div>
              <SectieTitel>Statistieken</SectieTitel>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 12,
                }}
              >
                <StatKaart label="Leden gepubliceerd" waarde={stats.entriesGepubliceerd} icon="📖" href="/beheer/vriendenboek" />
                <StatKaart label="Concepten" waarde={stats.entriesConcept} icon="📝" href="/beheer/vriendenboek" />
                <StatKaart label="Getagd, geen fiche" waarde={stats.entriesStub} icon="🏷️" href="/beheer/vriendenboek" />
                <StatKaart label="Kampplaatsen gekoppeld" waarde={stats.kampplaatsenGekoppeld} icon="❤️" href="/beheer/kampplaatsen" />
                <StatKaart label="Extra kampplaatsen" waarde={stats.extraLocatiesGepubliceerd} icon="📍" href="/beheer/kampplaatsen/extra" />
                <StatKaart label="Mijlpalen gepubliceerd" waarde={stats.mijlpalenGepubliceerd} icon="🚩" href="/beheer/tijdlijn" />
                <StatKaart label="Jaarkentekens" waarde={stats.kentekens} icon="🧭" href="/beheer/tijdlijn/kentekens" />
                <StatKaart label="Foto's" waarde={stats.fotosGepubliceerd} icon="📷" href="/beheer/fotos" />
                <StatKaart label="Links" waarde={stats.links} icon="🔗" href="/beheer/links" />
              </div>
            </div>
          </>
        )}
      </div>
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

function StatKaart({ label, waarde, icon, href }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: colors.paperCard,
          border: `1px solid ${colors.line}`,
          borderRadius: radius.card,
          padding: '16px 14px',
        }}
      >
        <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
        <div style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.ink }}>{waarde}</div>
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>{label}</div>
      </div>
    </Link>
  );
}
