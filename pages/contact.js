import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ContactFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import PublicNav from '../components/PublicNav';

function nieuweSom() {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  return { a, b };
}

export default function ContactPage() {
  const [naam, setNaam] = useState('');
  const [email, setEmail] = useState('');
  const [groep, setGroep] = useState('');
  const [bericht, setBericht] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [som, setSom] = useState(() => nieuweSom());
  const [somAntwoord, setSomAntwoord] = useState('');
  const [versturen, setVersturen] = useState(false);
  const [foutmelding, setFoutmelding] = useState(null);
  const [verzonden, setVerzonden] = useState(false);

  const handleVerstuur = async () => {
    setFoutmelding(null);

    if (!naam.trim() || !bericht.trim()) {
      setFoutmelding('Vul minstens je naam en een bericht in.');
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
      setVerzonden(true);
      return;
    }

    setVersturen(true);
    try {
      await ContactFactory.create({
        naam: naam.trim(),
        email: email.trim(),
        groep: groep.trim(),
        bericht: bericht.trim(),
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
          <title>Bedankt! — Contact</title>
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.ink, margin: '0 0 10px' }}>
              Bedankt!
            </h1>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, lineHeight: 1.5 }}>
              Je bericht is verstuurd. De websitebeheerder neemt zo snel
              mogelijk contact met je op.
            </p>
            <Link
              href="/"
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
              Terug naar de startpagina
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
        <title>Contact — Websitebeheerder</title>
      </Head>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 32px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 34, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Contacteer de websitebeheerder
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, maxWidth: 440, margin: '0 auto' }}>
            Een vraag, foutje gevonden, of ben je van een andere scoutsgroep
            en wil je ook zo'n website? Laat het hieronder weten.
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
          <Veld label="Naam" value={naam} onChange={setNaam} placeholder="Voornaam Achternaam" />
          <Veld label="E-mailadres" value={email} onChange={setEmail} placeholder="jouw@email.be" type="email" />
          <Veld label="Groep / gemeente (optioneel)" value={groep} onChange={setGroep} placeholder="bv. Scouts X, Y-stad" />
          <Veld label="Bericht" value={bericht} onChange={setBericht} multiline />

          {/* Honeypot: onzichtbaar voor mensen, wordt vaak automatisch ingevuld door bots */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
          >
            <label htmlFor="website5">Laat dit veld leeg</label>
            <input
              id="website5"
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

function Veld({ label, value, onChange, placeholder, type = 'text', multiline }) {
  return (
    <div>
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputStyle, width: '100%' }}
        />
      )}
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: radius.input,
  border: `1px solid ${colors.line}`,
  background: colors.white,
  fontFamily: fonts.body,
  fontSize: 14,
  color: colors.ink,
  boxSizing: 'border-box',
};
