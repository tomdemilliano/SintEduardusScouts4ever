import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import PublicNav from '../components/PublicNav';
import DishListEditor from '../components/DishListEditor';

const empty = {
  naam: '',
  geboortejaar: '',
  totemnaam: '',
  periode: '',
  leuksteActiviteit: '',
  besteKampplaats: [''],
  lekkersteEten: [''],
};

function nieuweSom() {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  return { a, b };
}

export default function ToevoegenPage() {
  const [fields, setFields] = useState(empty);
  const [honeypot, setHoneypot] = useState(''); // bots vullen dit vaak automatisch in
  const [som, setSom] = useState(() => nieuweSom());
  const [somAntwoord, setSomAntwoord] = useState('');
  const [versturen, setVersturen] = useState(false);
  const [foutmelding, setFoutmelding] = useState(null);
  const [verzonden, setVerzonden] = useState(false);

  const handleChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleVerstuur = async () => {
    setFoutmelding(null);

    if (!fields.naam.trim()) {
      setFoutmelding('Vul minstens je naam in.');
      return;
    }

    if (parseInt(somAntwoord, 10) !== som.a + som.b) {
      setFoutmelding('Dat is niet het juiste antwoord op de rekensom — probeer opnieuw.');
      setSom(nieuweSom());
      setSomAntwoord('');
      return;
    }

    // Honeypot ingevuld -> waarschijnlijk een bot. Doe stilletjes alsof het
    // gelukt is, zonder echt iets op te slaan.
    if (honeypot.trim()) {
      setVerzonden(true);
      return;
    }

    setVersturen(true);
    try {
      await EntryFactory.create({
        ...fields,
        besteKampplaats: fields.besteKampplaats.map((k) => k.trim()).filter(Boolean),
        lekkersteEten: fields.lekkersteEten.map((g) => g.trim()).filter(Boolean),
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
      <div style={{ minHeight: '100vh', background: colors.paper }}>
        <Head>
          <link rel="stylesheet" href={fontImports} />
          <title>Bedankt! — Vriendenboekje</title>
        </Head>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px 100px' }}>
          <PublicNav />
          <div
            style={{
              marginTop: 60,
              textAlign: 'center',
              background: colors.paperCard,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.card,
              padding: '40px 32px',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🙌</div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.ink, margin: '0 0 10px' }}>
              Bedankt!
            </h1>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, lineHeight: 1.5 }}>
              Je gegevens zijn verstuurd. De beheerder van het vriendenboekje
              moet ze nog even nakijken voor ze zichtbaar worden — dat kan
              soms wel eventjes duren, dus even geduld.
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
              Terug naar het vriendenboekje
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.paper }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Zelf toevoegen — Vriendenboekje</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 32px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 34, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Vul jezelf in
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, maxWidth: 440, margin: '0 auto' }}>
            Had je geen papieren formulier ingevuld op de reünie, maar wil je
            toch in het vriendenboekje staan? Vul hieronder dezelfde vragen
            in. Na het versturen kijkt de beheerder alles even na voor het
            gepubliceerd wordt.
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
          <Veld label="Naam" value={fields.naam} onChange={(v) => handleChange('naam', v)} placeholder="Voornaam Achternaam" />
          <Veld label="Geboortejaar" value={fields.geboortejaar} onChange={(v) => handleChange('geboortejaar', v)} placeholder="19.." />
          <Veld label="Totemnaam" value={fields.totemnaam} onChange={(v) => handleChange('totemnaam', v)} />
          <Veld label="Lid in periode" value={fields.periode} onChange={(v) => handleChange('periode', v)} placeholder="1952 - 1955" />
          <Veld
            label="Plezantste spel / strafste activiteit"
            value={fields.leuksteActiviteit}
            onChange={(v) => handleChange('leuksteActiviteit', v)}
            multiline
          />

          <div>
            <Label>Beste kampplaats ooit</Label>
            <DishListEditor
              value={fields.besteKampplaats}
              onChange={(lijst) => handleChange('besteKampplaats', lijst)}
              placeholder="bv. Falmignoul (Walzin)"
              mergeLabel="Samenvoegen met vorige kampplaats"
            />
          </div>

          <div>
            <Label>Lekkerste kamp-eten</Label>
            <DishListEditor
              value={fields.lekkersteEten}
              onChange={(lijst) => handleChange('lekkersteEten', lijst)}
              mergeLabel="Samenvoegen met vorig gerecht"
            />
          </div>

          {/* Honeypot: onzichtbaar voor mensen, wordt vaak automatisch ingevuld door bots */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
          >
            <label htmlFor="website">Laat dit veld leeg</label>
            <input
              id="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div
            style={{
              border: `1px dashed ${colors.line}`,
              borderRadius: radius.card,
              padding: '14px 16px',
            }}
          >
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

function Veld({ label, value, onChange, placeholder, multiline }) {
  return (
    <div>
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
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
