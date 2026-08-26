import { useRouter } from 'next/router';
import Head from 'next/head';
import EntryForm from '../../../components/EntryForm';
import { EntryFactory, ScanStorageFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports } from '../../../lib/theme';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/vriendenboek', label: 'Overzicht', exact: true },
  { href: '/beheer/vriendenboek/upload', label: '+ Eén scan' },
  { href: '/beheer/vriendenboek/bulk-upload', label: '+ Meerdere scans' },
  { href: '/beheer/vriendenboek/wijzigingen', label: '✏️ Wijzigingsvoorstellen' },
];

export default function UploadPage() {
  return (
    <RequireAuth>
      <UploadContent />
    </RequireAuth>
  );
}

function UploadContent() {
  const router = useRouter();

  const handleSave = async (fields, file) => {
    const entryId = await EntryFactory.create(fields);
    if (file) {
      const { url, path } = await ScanStorageFactory.upload(file, entryId);
      await EntryFactory.update(entryId, { scanUrl: url, scanPath: path });
    }
    router.push('/beheer/vriendenboek');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Nieuwe scan — Vriendenboek</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 32,
            fontWeight: 600,
            color: colors.ink,
            margin: '0 0 20px',
          }}
        >
          Vriendenboek
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Nieuwe scan toevoegen
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 28 }}>
          Upload een ingescand formulier, laat de tekst herkennen en corrigeer waar nodig
          voor je het publiceert.
        </p>

        <EntryForm onSave={handleSave} saveLabel="Opslaan als concept" />
      </div>
    </div>
  );
}
