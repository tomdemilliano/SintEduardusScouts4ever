import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { MijlpaalFactory, ActivityFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import PublicNav from '../components/PublicNav';

function nieuweSom() {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  return { a, b };
}

export default function MijlpaalToevoegenPage() {
  const [jaar, setJaar] = useState('');
  const [titel, setTitel] = useState('');
  const [beschrijving, setBeschrijving] = useState('');
  const [type, setType] = useState('groep');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [som, setSom] = useState(() => nieuweSom());
  const [somAntwoord, setSomAntwoord] = useState('');
  const [versturen, setVersturen] = useState(false);
  const [foutmelding, setFoutmelding] = useState(null);
  const [verzonden, setVerzonden] = useState(false);

  const handleVerstuur = async () => {
    setFoutmelding(null);

    const jaarNum = parseInt(jaar, 10);
    if (!jaarNum || jaarNum < 1900 || jaarNum > 2200) {
      setFoutmelding('Vul een geldig jaartal in.');
      return;
    }
    if (!titel.trim()) {
      setFoutmelding('Vul een titel in.');
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
      const nieuwId = await MijlpaalFactory.createPublic({
        jaar: jaarNum,
        titel: titel.trim(),
        beschrijving: beschrijving.trim(),
        type,
        contactEmail: email.trim(),
      });
      ActivityFactory.log({
        type: 'mijlpaal',
        actie: 'Nieuwe mijlpaal voorgesteld',
        itemId: nieuwId,
        omschrijving: `${jaarNum} — "${titel.trim()}" — wacht op goedkeuring.`,
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚩</div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.ink, margin: '0 0 10px' }}>
              Bedankt!
            </h1>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, lineHeight: 1.5 }}>
              Je mijlpaal is verstuurd. De beheerder kijkt 'm nog even na voor
              hij op de tijdlijn verschijnt — dat kan soms wel eventjes duren.
            </p>
            <Link
              href="/tijdlijn"
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
              Terug naar de tijdlijn
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
        <title>Mijlpaal voorstellen — Vrienden van Sint-Eduardusscouts</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 32px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 34, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Stel een mijlpaal voor
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, maxWidth: 440, margin: '0 auto' }}>
            Ken je een belangrijk moment uit de geschiedenis van de groep dat
            nog niet op de tijdlijn staat? Vul het hieronder aan. De beheerder
            kijkt het na voor het gepubliceerd wordt.
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
            <Label>Soort mijlpaal</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setType('groep')}
                style={typeBtn(type === 'groep')}
              >
                🚩 Iets van onze groep
              </button>
              <button
                type="button"
                onClick={() => setType('scouting')}
                style={typeBtn(type === 'scouting')}
              >
                ⚜️ Iets uit de scoutsbeweging
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 110 }}>
              <Label>Jaar</Label>
              <input type="number" value={jaar} onChange={(e) => setJaar(e.target.value)} placeholder="1944" style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Label>Titel</Label>
              <input
                type="text"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder="bv. Oprichting van de groep"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <Label>Beschrijving (optioneel)</Label>
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              rows={3}
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
            <label htmlFor="website2">Laat dit veld leeg</label>
            <input
              id="website2"
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

function typeBtn(actief) {
  return {
    padding: '8px 14px',
    borderRadius: 999,
    border: `1.5px solid ${actief ? colors.forest : colors.line}`,
    background: actief ? colors.forest : colors.white,
    color: actief ? colors.white : colors.ink,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
}
