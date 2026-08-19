import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PhotoFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import { resizeImageFile } from '../lib/utils';
import PublicNav from '../components/PublicNav';

function nieuweSom() {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  return { a, b };
}

const STATUS_LABEL = {
  wachtend: 'Wachtend…',
  verkleinen: 'Bezig met verkleinen…',
  uploaden: 'Bezig met opladen…',
  klaar: 'Klaar',
  fout: 'Mislukt',
};

export default function FotoToevoegenPage() {
  const [bestanden, setBestanden] = useState([]); // { id, file, status }
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [som, setSom] = useState(() => nieuweSom());
  const [somAntwoord, setSomAntwoord] = useState('');
  const [versturen, setVersturen] = useState(false);
  const [foutmelding, setFoutmelding] = useState(null);
  const [verzonden, setVerzonden] = useState(null); // aantal foto's, of null

  const handleBestanden = (e) => {
    const gekozen = Array.from(e.target.files || []);
    setBestanden(
      gekozen.map((file, i) => ({ id: `${Date.now()}-${i}`, file, status: 'wachtend' }))
    );
  };

  const handleVerstuur = async () => {
    setFoutmelding(null);

    if (bestanden.length === 0) {
      setFoutmelding('Kies minstens één foto.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFoutmelding('Vul een geldig e-mailadres in.');
      return;
    }
    if (parseInt(somAntwoord, 10) !== som.a + som.b) {
      setFoutmelding('Dat is niet het juiste antwoord op de rekensom — probeer opnieuw.');
      setSom(nieuweSom());
      setSomAntwoord('');
      return;
    }

    if (honeypot.trim()) {
      setVerzonden(bestanden.length);
      return;
    }

    setVersturen(true);
    try {
      const updateStatus = (i, status) =>
        setBestanden((prev) => prev.map((b, idx) => (idx === i ? { ...b, status } : b)));

      const verkleind = [];
      for (let i = 0; i < bestanden.length; i++) {
        updateStatus(i, 'verkleinen');
        verkleind.push(await resizeImageFile(bestanden[i].file));
      }

      const aantal = await PhotoFactory.createBulkPublic(
        verkleind,
        { contactEmail: email.trim() },
        (i, status) => updateStatus(i, status === 'bezig' ? 'uploaden' : status)
      );
      setVerzonden(aantal);
    } catch (err) {
      setFoutmelding('Er ging iets mis bij het versturen. Probeer het straks nog eens.');
    } finally {
      setVersturen(false);
    }
  };

  if (verzonden != null) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Head>
          <link rel="stylesheet" href={fontImports} />
          <title>Bedankt! — Vrienden van Sint-Eduardusscouts</title>
        </Head>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px 100px' }}>
          <PublicNav />
          <div
            style={{
              marginTop: 40,
              textAlign: 'center',
              background: colors.paperCard,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.card,
              padding: '40px 32px',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.ink, margin: '0 0 10px' }}>
              Bedankt!
            </h1>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, lineHeight: 1.5 }}>
              {verzonden} foto{verzonden === 1 ? '' : "'s"} verstuurd. De beheerder kijkt ze nog even na
              voor ze op de pagina verschijnen — dat kan soms wel eventjes duren.
            </p>
            <Link
              href="/fotos"
              style={{
                display: 'inline-block',
                marginTop: 20,
                padding: '10px 22px',
                borderRadius: radius.badge,
                background: colors.forest,
                color: colors.white,
                fontFamily: fonts.body,
                fontWeight: 600,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              Terug naar de foto's
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Foto's toevoegen — Vrienden van Sint-Eduardusscouts</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 32px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 34, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Foto's toevoegen
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, maxWidth: 460, margin: '0 auto' }}>
            Kies één of meerdere foto's van je toestel. Ze worden automatisch
            wat verkleind en dan opgeladen. Tags (jaar, locatie, wie erop
            staat) kan je later, of iemand anders, gewoon bij elke foto zelf
            toevoegen.
          </p>
        </div>

        <div
          style={{
            background: colors.paperCard,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.card,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <Label>Foto's</Label>
            <label
              style={{
                display: 'block',
                border: `1.5px dashed ${colors.line}`,
                borderRadius: radius.card,
                padding: 20,
                textAlign: 'center',
                cursor: 'pointer',
                fontFamily: fonts.body,
                fontSize: 13,
                color: colors.inkMuted,
              }}
            >
              {bestanden.length === 0
                ? "Klik om één of meerdere foto's te kiezen"
                : `${bestanden.length} foto${bestanden.length === 1 ? '' : "'s"} gekozen`}
              <input type="file" accept="image/*" multiple onChange={handleBestanden} style={{ display: 'none' }} />
            </label>

            {bestanden.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                {bestanden.map((b) => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.body, fontSize: 12 }}>
                    <span style={{ color: colors.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.file.name}
                    </span>
                    <span style={{ color: b.status === 'fout' ? colors.stamp : b.status === 'klaar' ? colors.forest : colors.campfire, fontWeight: 600 }}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Je e-mailadres</Label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.be"
              style={inputStyle}
            />
            <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginTop: 4 }}>
              Enkel zichtbaar voor de beheerder, voor eventuele vragen — niet publiek.
            </p>
          </div>

          {/* Honeypot: onzichtbaar voor mensen, wordt vaak automatisch ingevuld door bots */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
          >
            <label htmlFor="website4">Laat dit veld leeg</label>
            <input
              id="website4"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div style={{ border: `1px dashed ${colors.line}`, borderRadius: radius.card, padding: '14px 16px' }}>
            <Label>Even controleren dat je geen robot bent</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>
                Hoeveel is {som.a} + {som.b}?
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={somAntwoord}
                onChange={(e) => setSomAntwoord(e.target.value)}
                style={{ ...inputStyle, width: 70 }}
              />
            </div>
          </div>

          {foutmelding && (
            <div style={{ color: colors.stamp, fontFamily: fonts.body, fontSize: 13 }}>{foutmelding}</div>
          )}

          <button
            onClick={handleVerstuur}
            disabled={versturen}
            style={{
              alignSelf: 'flex-start',
              padding: '12px 24px',
              borderRadius: radius.badge,
              border: 'none',
              background: versturen ? colors.inkMuted : colors.forest,
              color: colors.white,
              fontFamily: fonts.body,
              fontWeight: 600,
              fontSize: 14,
              cursor: versturen ? 'default' : 'pointer',
            }}
          >
            {versturen ? 'Bezig met versturen…' : 'Versturen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <label
      style={{
        display: 'block',
        fontFamily: fonts.body,
        fontSize: 12,
        fontWeight: 600,
        color: colors.inkMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 4,
      }}
    >
      {children}
    </label>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: radius.input,
  border: `1px solid ${colors.line}`,
  background: colors.white,
  fontFamily: fonts.body,
  fontSize: 14,
  color: colors.ink,
  boxSizing: 'border-box',
};
