import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory, ActivityFactory } from '../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../lib/theme';
import PublicNav from '../components/PublicNav';
import DishListEditor from '../components/DishListEditor';

const empty = {
  naam: '',
  geboortejaar: '',
  totemnaam: '',
  periode: '',
  leuksteActiviteit: [''],
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
  const [nieuwEntryId, setNieuwEntryId] = useState(null);

  // "Ben jij misschien X?" -- controle op bestaande stub-fiches
  const [kandidaten, setKandidaten] = useState([]);
  const [gekozenStub, setGekozenStub] = useState(null); // { id, naam } of null
  const [promptAfgewezenVoor, setPromptAfgewezenVoor] = useState(null);

  useEffect(() => {
    if (gekozenStub) return; // al bevestigd, niet opnieuw controleren
    const naamTrim = fields.naam.trim();
    if (naamTrim.length < 3 || naamTrim === promptAfgewezenVoor) {
      setKandidaten([]);
      return;
    }
    const timer = setTimeout(() => {
      EntryFactory.zoekMogelijkeStub(naamTrim).then(setKandidaten);
    }, 500);
    return () => clearTimeout(timer);
  }, [fields.naam, gekozenStub, promptAfgewezenVoor]);

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
      const opgeschoond = {
        ...fields,
        leuksteActiviteit: fields.leuksteActiviteit.map((a) => a.trim()).filter(Boolean),
        besteKampplaats: fields.besteKampplaats.map((k) => k.trim()).filter(Boolean),
        lekkersteEten: fields.lekkersteEten.map((g) => g.trim()).filter(Boolean),
      };
      if (gekozenStub) {
        // Bevestigd "ja, dat ben ik" -- de bestaande stub-fiche bijwerken
        // i.p.v. een nieuwe, dubbele entry aan te maken. De beheerder moet
        // deze koppeling nadien nog expliciet bevestigen (blijft daarom,
        // bewust anders dan hieronder, volledig verborgen tot dan).
        await EntryFactory.upgradeStubMetFormulier(gekozenStub.id, opgeschoond);
        ActivityFactory.log({
          type: 'entry',
          actie: 'Stub-fiche gekoppeld aan formulier',
          itemId: gekozenStub.id,
          omschrijving: `"${opgeschoond.naam}" — koppeling wacht op bevestiging door de beheerder.`,
        });
      } else {
        // Meteen zichtbaar (met een "wacht op goedkeuring"-label) i.p.v.
        // pas na nazicht door de beheerder -- er is hier geen scan/OCR die
        // eerst gecontroleerd moet worden.
        const nieuwId = await EntryFactory.createPublicSubmission(opgeschoond);
        setNieuwEntryId(nieuwId);
        ActivityFactory.log({
          type: 'entry',
          actie: 'Nieuw vriendenboekje-formulier ingediend',
          itemId: nieuwId,
          omschrijving: `"${opgeschoond.naam}" — al zichtbaar, wacht op goedkeuring.`,
        });
      }
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>{gekozenStub ? '🔍' : '🙌'}</div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.ink, margin: '0 0 10px' }}>
              {gekozenStub ? 'Bijna klaar!' : 'Bedankt!'}
            </h1>
            {gekozenStub ? (
              <>
                <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, lineHeight: 1.5 }}>
                  Je gegevens zijn verstuurd, maar staan <strong>nog niet meteen online</strong>.
                </p>
                <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, lineHeight: 1.5, textAlign: 'left', background: colors.paper, borderRadius: radius.input, padding: '10px 14px', marginTop: 10 }}>
                  Waarom? Je koppelde je antwoord aan een naam die al eerder
                  ergens getagd werd (op een foto of in een leidingsploeg).
                  Daardoor worden automatisch een aantal bestaande koppelingen
                  aan jouw fiche gelegd — en dat wil de beheerder eerst even
                  controleren, om zeker te zijn dat het ook echt om dezelfde
                  persoon gaat. Dat kan soms wel eventjes duren.
                </p>
              </>
            ) : (
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, lineHeight: 1.5 }}>
                Je fiche staat al online! De beheerder kijkt ze binnenkort nog
                even na — zolang dat nog niet gebeurd is, zie je daar zelf een
                klein "wacht op goedkeuring"-label bij staan.
              </p>
            )}
            {nieuwEntryId && (
              <Link
                href={`/entry/${nieuwEntryId}`}
                style={{
                  display: 'inline-block',
                  marginTop: 14,
                  fontFamily: fonts.body,
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.forest,
                }}
              >
                → Bekijk je eigen fiche
              </Link>
            )}
            <Link
              href="/vriendenboekje"
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
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
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
            in. Je fiche komt na het versturen meteen online te staan (met
            een "wacht op goedkeuring"-label tot de beheerder ze even nakeek).
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

          {gekozenStub && (
            <div
              style={{
                background: colors.forest,
                borderRadius: radius.card,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.white, fontWeight: 600 }}>
                ✓ Gekoppeld aan de bestaande, al eerder getagde fiche van "{gekozenStub.naam}"
              </span>
              <button
                type="button"
                onClick={() => {
                  setGekozenStub(null);
                  setPromptAfgewezenVoor(fields.naam.trim());
                }}
                style={{ background: 'none', border: 'none', color: colors.white, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}
              >
                Toch niet
              </button>
            </div>
          )}

          {!gekozenStub && kandidaten.length > 0 && (
            <div
              style={{
                background: colors.campfireLight,
                border: `1.5px dashed ${colors.campfire}`,
                borderRadius: radius.card,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {kandidaten.map((k) => (
                <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>
                    Ben jij misschien <strong>{k.naam}</strong>? Die naam staat al getagd op foto's/leidingsploegen.
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setGekozenStub({ id: k.id, naam: k.naam })}
                      style={{ padding: '6px 14px', borderRadius: radius.badge, border: 'none', background: colors.forest, color: colors.white, fontFamily: fonts.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Ja, dat ben ik
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromptAfgewezenVoor(fields.naam.trim())}
                      style={{ padding: '6px 14px', borderRadius: radius.badge, border: `1px solid ${colors.line}`, background: colors.white, color: colors.ink, fontFamily: fonts.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Nee, iemand anders
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Veld label="Geboortejaar" value={fields.geboortejaar} onChange={(v) => handleChange('geboortejaar', v)} placeholder="19.." />
          <Veld label="Totemnaam" value={fields.totemnaam} onChange={(v) => handleChange('totemnaam', v)} />
          <Veld label="Lid in periode" value={fields.periode} onChange={(v) => handleChange('periode', v)} placeholder="1952 - 1955" />

          <div>
            <Label>Plezantste spel / strafste activiteit</Label>
            <DishListEditor
              value={fields.leuksteActiviteit}
              onChange={(lijst) => handleChange('leuksteActiviteit', lijst)}
              placeholder="bv. Toneelspelen"
              mergeLabel="Samenvoegen met vorige activiteit"
              addLabel="+ Activiteit toevoegen"
            />
          </div>

          <div>
            <Label>Beste kampplaats ooit</Label>
            <DishListEditor
              value={fields.besteKampplaats}
              onChange={(lijst) => handleChange('besteKampplaats', lijst)}
              placeholder="bv. Falmignoul (Walzin)"
              mergeLabel="Samenvoegen met vorige kampplaats"
              addLabel="+ Kampplaats toevoegen"
            />
          </div>

          <div>
            <Label>Lekkerste kamp-eten</Label>
            <DishListEditor
              value={fields.lekkersteEten}
              onChange={(lijst) => handleChange('lekkersteEten', lijst)}
              mergeLabel="Samenvoegen met vorig gerecht"
              addLabel="+ Gerecht toevoegen"
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
