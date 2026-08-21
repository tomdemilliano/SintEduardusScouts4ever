import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import EntryForm from '../../../components/EntryForm';
import { EntryFactory, ScanStorageFactory, PhotoFactory, LeidingFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/vriendenboek', label: 'Overzicht', exact: true },
  { href: '/beheer/vriendenboek/upload', label: '+ Eén scan' },
  { href: '/beheer/vriendenboek/bulk-upload', label: '+ Meerdere scans' },
];

export default function EditEntryPage() {
  return (
    <RequireAuth>
      <EditEntryContent />
    </RequireAuth>
  );
}

function EditEntryContent() {
  const router = useRouter();
  const { id } = router.query;
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aantalFotos, setAantalFotos] = useState(0);
  const [aantalLeiding, setAantalLeiding] = useState(0);
  const [koppelingBevestigd, setKoppelingBevestigd] = useState(true);

  useEffect(() => {
    if (!id) return;
    EntryFactory.getById(id).then((e) => {
      setEntry(e);
      setKoppelingBevestigd(e?.koppelingBevestigd !== false);
      setLoading(false);
      if (e) {
        Promise.all([PhotoFactory.getByEntryId(id), LeidingFactory.getByEntryId(id)]).then(
          ([fotos, leiding]) => {
            setAantalFotos(fotos.length);
            setAantalLeiding(leiding.length);
          }
        );
      }
    });
  }, [id]);

  const handleSave = async (fields, file) => {
    const updates = { ...fields };
    if (file) {
      const { url, path } = await ScanStorageFactory.upload(file, id);
      updates.scanUrl = url;
      updates.scanPath = path;
    }
    await EntryFactory.update(id, updates);
    router.push('/beheer/vriendenboek');
  };

  const handleBevestigKoppeling = async () => {
    await EntryFactory.bevestigKoppeling(id);
    setKoppelingBevestigd(true);
  };

  const handlePublish = async () => {
    await EntryFactory.publish(id);
    router.push('/beheer/vriendenboek');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', padding: 48 }}>
        <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', padding: 48 }}>
        <p style={{ fontFamily: fonts.body, color: colors.stamp }}>Formulier niet gevonden.</p>
      </div>
    );
  }

  const heeftBestaandeTags = aantalFotos > 0 || aantalLeiding > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>{entry.naam} bewerken — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Vriendenboek
        </h1>

        <AdminSubNav tabs={TABS} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '0 0 6px', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: 0 }}>
            {entry.naam || '(naamloos)'} bewerken
          </h2>
          {entry.status !== 'published' && (
            <button
              onClick={handlePublish}
              disabled={!koppelingBevestigd}
              title={!koppelingBevestigd ? 'Bevestig eerst de koppeling hieronder' : undefined}
              style={{
                padding: '9px 18px',
                borderRadius: radius.badge,
                border: 'none',
                background: koppelingBevestigd ? colors.forest : colors.inkMuted,
                color: colors.white,
                fontFamily: fonts.body,
                fontWeight: 600,
                fontSize: 13,
                cursor: koppelingBevestigd ? 'pointer' : 'not-allowed',
              }}
            >
              Publiceren
            </button>
          )}
        </div>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 20 }}>
          Je kan hier opnieuw herkennen op een nieuwe scan, of de velden manueel corrigeren.
        </p>

        {heeftBestaandeTags && (
          <div
            style={{
              background: koppelingBevestigd ? colors.paperCard : colors.campfireLight,
              border: `1.5px ${koppelingBevestigd ? 'solid' : 'dashed'} ${koppelingBevestigd ? colors.line : colors.campfire}`,
              borderRadius: radius.card,
              padding: '14px 18px',
              marginBottom: 24,
            }}
          >
            <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, margin: '0 0 10px' }}>
              📷 Deze persoon is al getagd in <strong>{aantalFotos}</strong> foto{aantalFotos === 1 ? '' : "'s"} en{' '}
              <strong>{aantalLeiding}</strong> leidingsploeg{aantalLeiding === 1 ? '' : 'en'}
              {!koppelingBevestigd && ' — controleer of dit écht dezelfde persoon is als dit formulier voor je publiceert.'}
            </p>
            {koppelingBevestigd ? (
              <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forest, fontWeight: 600 }}>
                ✓ Koppeling bevestigd
              </span>
            ) : (
              <button
                onClick={handleBevestigKoppeling}
                style={{
                  padding: '8px 16px',
                  borderRadius: radius.badge,
                  border: 'none',
                  background: colors.campfire,
                  color: colors.white,
                  fontFamily: fonts.body,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                ✓ Ja, dit is dezelfde persoon — koppeling bevestigen
              </button>
            )}
          </div>
        )}

        <EntryForm
          initialValues={{
            naam: entry.naam || '',
            geboortejaar: entry.geboortejaar || '',
            totemnaam: entry.totemnaam || '',
            periode: entry.periode || '',
            leuksteActiviteit: entry.leuksteActiviteit || '',
            besteKampplaats: entry.besteKampplaats || '',
            lekkersteEten: entry.lekkersteEten || '',
          }}
          initialScanUrl={entry.scanUrl}
          onSave={handleSave}
          saveLabel="Wijzigingen opslaan"
        />
      </div>
    </div>
  );
}
