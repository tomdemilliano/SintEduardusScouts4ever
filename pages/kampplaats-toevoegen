import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ExtraLocationFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import PublicNav from '../components/PublicNav';

function nieuweSom() {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  return { a, b };
}

export default function KampplaatsToevoegenPage() {
  const [naam, setNaam] = useState('');
  const [beschrijving, setBeschrijving] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [som, setSom] = useState(() => nieuweSom());
  const [somAntwoord, setSomAntwoord] = useState('');
  const [versturen, setVersturen] = useState(false);
  const [foutmelding, setFoutmelding] = useState(null);
  const [verzonden, setVerzonden] = useState(false);

  const handleVerstuur = async () => {
    setFoutmelding(null);

    if (!naam.trim()) {
      setFoutmelding('Vul een naam voor de kampplaats in.');
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
      // waarschijnlijk een bot — doe alsof het gelukt is, sla niets op
      setVerzonden(true);
      return;
    }

    setVersturen(true);
    try {
      await ExtraLocationFactory.createPublic({
        naam: naam.trim(),
        beschrijving: beschrijving.trim(),
        contactEmail: email.trim(),
      });
      setVerzonden(true);
    } catch (err) {
      setFoutmelding('Er ging iets mis bij het versturen. Probeer het straks nog eens.');
    } finally {
      setVersturen(false);
    }
  };

  if (verzonden) {
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.ink, margin: '0 0 10px' }}>
              Bedankt!
            </h1>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, lineHeight: 1.5 }}>
              Je kampplaats is verstuurd. De beheerder kijkt 'm nog even na
              voor hij op de pagina verschijnt — dat kan soms wel eventjes duren.
            </p>
            <Link
              href="/kampplaatsen"
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
              Terug naar de kampplaatsen
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
        <title>Kampplaats voorstellen — Vrienden van Sint-Eduardusscouts</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 32px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 34, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Stel een kampplaats voor
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, maxWidth: 440, margin: '0 auto' }}>
            Ken je een toffe kampplaats die nog niet op de pagina staat? Vul
            'm hieronder aan. De beheerder kijkt het na (en zet de plek op de
            kaart) voor het gepubliceerd wordt.
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
            <Label>Naam van de kampplaats</Label>
            <input
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="bv. Provinciaal domein Zilvermeer, Mol"
              style={inputStyle}
            />
          </div>

          <div>
            <Label>Beschrijving (optioneel)</Label>
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              rows={3}
              placeholder="Waarom is dit een toffe plek?"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
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
            <label htmlFor="website3">Laat dit veld leeg</label>
            <input
              id="website3"
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
