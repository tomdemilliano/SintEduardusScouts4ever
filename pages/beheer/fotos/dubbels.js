import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PhotoFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import { berekenBeeldHashVanUrl, hammingAfstand } from '../../../lib/utils';
import RequireAuth from '../../../components/RequireAuth';
import AdminSubNav from '../../../components/AdminSubNav';

const TABS = [
  { href: '/beheer/fotos', label: 'Overzicht', exact: true },
  { href: '/beheer/fotos/toevoegen', label: "+ Foto's toevoegen" },
  { href: '/beheer/fotos/tags', label: 'Tags' },
  { href: '/beheer/fotos/dubbels', label: '🔍 Dubbels' },
];

// Hoe kleiner, hoe strenger (0 = enkel identieke hash). 64 bits totaal;
// een verschil van een paar bits komt overeen met een zeer sterk
// gelijkende foto (lichte compressie/verkleining), niet toevallig gelijkend.
const DREMPEL_GELIJKAARDIG = 6;

export default function FotosDubbelsPage() {
  return (
    <RequireAuth>
      <FotosDubbelsContent />
    </RequireAuth>
  );
}

function FotosDubbelsContent() {
  const [status, setStatus] = useState('klaar'); // klaar | bezig
  const [voortgang, setVoortgang] = useState({ huidig: 0, totaal: 0 });
  const [clusters, setClusters] = useState(null); // null = nog niet gescand
  const [fout, setFout] = useState(null);

  const scan = async () => {
    setStatus('bezig');
    setFout(null);
    setClusters(null);
    try {
      const fotos = await PhotoFactory.getAllAdmin();
      const bruikbaar = fotos.filter((f) => f.status === 'published' && !f.verwijderVerzoek);
      setVoortgang({ huidig: 0, totaal: bruikbaar.length });

      // Hashes verzamelen: bestaande hergebruiken, ontbrekende berekenen
      // (en meteen opslaan, zodat een volgende scan sneller gaat).
      const metHash = [];
      for (let i = 0; i < bruikbaar.length; i++) {
        const foto = bruikbaar[i];
        let hash = foto.beeldHash;
        if (!hash) {
          try {
            hash = await berekenBeeldHashVanUrl(foto.afbeeldingUrl);
            await PhotoFactory.setBeeldHash(foto.id, hash);
          } catch (e) {
            hash = null;
          }
        }
        if (hash) metHash.push({ ...foto, beeldHash: hash });
        setVoortgang({ huidig: i + 1, totaal: bruikbaar.length });
      }

      // Clusters vormen: elke foto vergelijken met elke andere (klein genoeg
      // aantal voor deze schaal om dit gewoon client-side te doen).
      const bezocht = new Set();
      const gevondenClusters = [];
      for (let i = 0; i < metHash.length; i++) {
        if (bezocht.has(metHash[i].id)) continue;
        const cluster = [metHash[i]];
        for (let j = i + 1; j < metHash.length; j++) {
          if (bezocht.has(metHash[j].id)) continue;
          if (hammingAfstand(metHash[i].beeldHash, metHash[j].beeldHash) <= DREMPEL_GELIJKAARDIG) {
            cluster.push(metHash[j]);
            bezocht.add(metHash[j].id);
          }
        }
        if (cluster.length > 1) {
          bezocht.add(metHash[i].id);
          gevondenClusters.push(cluster);
        }
      }
      // Grootste/meest verdachte clusters eerst
      gevondenClusters.sort((a, b) => b.length - a.length);
      setClusters(gevondenClusters);
    } catch (err) {
      setFout('Er ging iets mis tijdens het scannen. Probeer het opnieuw.');
    } finally {
      setStatus('klaar');
    }
  };

  const handleVerwijderen = async (foto) => {
    if (!confirm(`Deze foto definitief verwijderen?`)) return;
    await PhotoFactory.remove(foto.id, foto.afbeeldingPath);
    setClusters((prev) =>
      prev
        .map((cluster) => cluster.filter((f) => f.id !== foto.id))
        .filter((cluster) => cluster.length > 1)
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Dubbele foto's — Beheer</title>
      </Head>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Foto's
        </h1>

        <AdminSubNav tabs={TABS} />

        <h2 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink, margin: '0 0 6px' }}>
          Dubbels & gelijkaardige foto's opsporen
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, marginBottom: 20 }}>
          Vergelijkt alle gepubliceerde foto's op visuele gelijkenis (niet
          enkel exact identieke bestanden) — handig omdat verschillende
          bezoekers soms zonder het te weten dezelfde foto opladen. De
          eerste scan kan even duren (elke foto zonder eerder berekende
          "vingerafdruk" moet eerst geladen worden); nadien gaat het sneller.
        </p>

        <button
          onClick={scan}
          disabled={status === 'bezig'}
          style={{
            padding: '10px 22px',
            borderRadius: radius.badge,
            border: 'none',
            background: status === 'bezig' ? colors.inkMuted : colors.forest,
            color: colors.white,
            fontFamily: fonts.body,
            fontWeight: 600,
            fontSize: 14,
            cursor: status === 'bezig' ? 'default' : 'pointer',
            marginBottom: 20,
          }}
        >
          {status === 'bezig'
            ? `Bezig… (${voortgang.huidig}/${voortgang.totaal})`
            : clusters === null
            ? 'Scan starten'
            : 'Opnieuw scannen'}
        </button>

        {fout && <p style={{ color: colors.stamp, fontFamily: fonts.body, fontSize: 13 }}>{fout}</p>}

        {clusters !== null && clusters.length === 0 && (
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
            🎉 Geen dubbels of sterk gelijkende foto's gevonden.
          </div>
        )}

        {clusters !== null && clusters.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, margin: 0 }}>
              {clusters.length} mogelijke groep{clusters.length === 1 ? '' : 'en'} gevonden. Bekijk
              elke groep en verwijder eventueel de overtollige exemplaren.
            </p>
            {clusters.map((cluster, i) => (
              <div
                key={i}
                style={{
                  background: colors.campfireLight,
                  border: `1.5px dashed ${colors.campfire}`,
                  borderRadius: radius.card,
                  padding: 16,
                }}
              >
                <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: colors.campfire, marginBottom: 10 }}>
                  Groep {i + 1} — {cluster.length} gelijkende foto's
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                  {cluster.map((foto) => (
                    <div key={foto.id} style={{ background: colors.white, border: `1px solid ${colors.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
                      <Link href={`/fotos/${foto.id}`} target="_blank">
                        <img src={foto.afbeeldingUrl} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                      </Link>
                      <div style={{ padding: '4px 8px', fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted }}>
                        {[foto.jaar, foto.locatie].filter(Boolean).join(' · ') || 'geen tags'}
                      </div>
                      <button
                        onClick={() => handleVerwijderen(foto)}
                        style={{
                          width: '100%',
                          padding: '6px 0',
                          border: 'none',
                          background: colors.stamp,
                          color: colors.white,
                          fontFamily: fonts.body,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Verwijderen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
