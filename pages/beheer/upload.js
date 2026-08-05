import { useRouter } from 'next/router';
import Head from 'next/head';
import EntryForm from '../../components/EntryForm';
import { EntryFactory, ScanStorageFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports } from '../../lib/theme';
import RequireAuth from '../../components/RequireAuth';

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
    router.push('/beheer');
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.paper }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Nieuwe scan — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }}>
        <a
          href="/beheer"
          style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textDecoration: 'none' }}
        >
          ← Terug naar overzicht
        </a>
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 32,
            fontWeight: 600,
            color: colors.ink,
            margin: '12px 0 6px',
          }}
        >
          Nieuwe scan toevoegen
        </h1>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 28 }}>
          Upload een ingescand formulier, laat de tekst herkennen en corrigeer waar nodig
          voor je het publiceert.
        </p>

        <EntryForm onSave={handleSave} saveLabel="Opslaan als concept" />
      </div>
    </div>
  );
}
