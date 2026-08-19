import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import EntryForm from '../../../components/EntryForm';
import { EntryFactory, ScanStorageFactory } from '../../../lib/dbSchema';
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

  useEffect(() => {
    if (!id) return;
    EntryFactory.getById(id).then((e) => {
      setEntry(e);
      setLoading(false);
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
              style={{
                padding: '9px 18px',
                borderRadius: radius.badge,
                border: 'none',
                background: colors.forest,
                color: colors.white,
                fontFamily: fonts.body,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Publiceren
            </button>
          )}
        </div>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 28 }}>
          Je kan hier opnieuw herkennen op een nieuwe scan, of de velden manueel corrigeren.
        </p>

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
