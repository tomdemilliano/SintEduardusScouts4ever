import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { EntryFactory, WijzigingFactory, ActivityFactory } from '../../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../../lib/theme';
import PublicNav from '../../../components/PublicNav';
import DishListEditor from '../../../components/DishListEditor';

function nieuweSom() {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  return { a, b };
}

export default function WijzigenPage() {
  const router = useRouter();
  const { id } = router.query;
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState(null);
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [som, setSom] = useState(() => nieuweSom());
  const [somAntwoord, setSomAntwoord] = useState('');
  const [versturen, setVersturen] = useState(false);
  const [foutmelding, setFoutmelding] = useState(null);
  const [verzonden, setVerzonden] = useState(false);

  useEffect(() => {
    if (!id) return;
    EntryFactory.getById(id).then((e) => {
      const geldig = e && e.status === 'published';
      setEntry(geldig ? e : null);
      if (geldig) {
        setFields({
          naam: e.naam || '',
          geboortejaar: e.geboortejaar || '',
          totemnaam: e.totemnaam || '',
          periode: e.periode || '',
          leuksteActiviteit: e.leuksteActiviteit?.length ? e.leuksteActiviteit : [''],
          besteKampplaats: e.besteKampplaats?.length ? e.besteKampplaats : [''],
          lekkersteEten: e.lekkersteEten?.length ? e.lekkersteEten : [''],
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleVerstuur = async () => {
    setFoutmelding(null);

    if (!fields.naam.trim()) {
      setFoutmelding('Vul minstens de naam in.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFoutmelding('Vul een geldig e-mailadres in — de beheerder kan hiermee eventueel nog contact opnemen.');
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
      const opgeschoond = {
        ...fields,
        leuksteActiviteit: fields.leuksteActiviteit.map((a) => a.trim()).filter(Boolean),
        besteKampplaats: fields.besteKampplaats.map((k) => k.trim()).filter(Boolean),
        lekkersteEten: fields.lekkersteEten.map((g) => g.trim()).filter(Boolean),
      };
      await WijzigingFactory.create({ entryId: id, ...opgeschoond, email: email.trim() });
      ActivityFactory.log({
        type: 'entry',
        actie: 'Wijziging voorgesteld op vriendenboekje-fiche',
        itemId: id,
        omschrijving: `"${entry.naam}" — wacht op goedkeuring door de beheerder.`,
      });
      setVerzonden(true);
    } catch (err) {
      setFoutmelding('Er ging iets mis bij het versturen. Probeer het straks nog eens.');
    } finally {
      setVersturen(false);
    }
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
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px 100px' }}>
          <PublicNav />
          <p style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.stamp, marginTop: 40 }}>
            Deze fiche bestaat niet of is niet gepubliceerd.
          </p>
        </div>
      </div>
    );
  }

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
            <div style={{ fontSize: 40, marginBottom: 12 }}>✏️</div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 700, color: colors.ink, margin: '0 0 10px' }}>
              Bedankt!
            </h1>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, lineHeight: 1.5 }}>
              Je wijziging is doorgestuurd. De beheerder bekijkt ze eerst
              voor ze effectief wordt doorgevoerd op de fiche — dat kan
              soms wel eventjes duren.
            </p>
            <Link
              href={`/entry/${id}`}
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
              Terug naar de fiche
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
        <title>Wijziging voorstellen — {entry.naam}</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <div style={{ textAlign: 'center', margin: '28px 0 32px' }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 34, fontWeight: 700, color: colors.ink, margin: '0 0 8px' }}>
            Wijziging voorstellen
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, maxWidth: 460, margin: '0 auto' }}>
            Klopt er iets niet (meer) aan de fiche van <strong>{entry.naam}</strong>?
            Pas hieronder aan wat nodig is. De beheerder bekijkt je voorstel
            eerst voor het effectief wordt doorgevoerd.
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
          <Veld label="Naam" value={fields.naam} onChange={(v) => handleChange('naam', v)} />
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

          <Veld label="Je e-mailadres" value={email} onChange={setEmail} placeholder="jouw@email.be" />
          <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, margin: '-10px 0 0' }}>
            Enkel zichtbaar voor de beheerder, voor eventuele controle — niet publiek.
          </p>

          {/* Honeypot: onzichtbaar voor mensen, wordt vaak automatisch ingevuld door bots */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
          >
            <label htmlFor="website6">Laat dit veld leeg</label>
            <input
              id="website6"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={handleVerstuur}
              disabled={versturen}
              style={{
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
              {versturen ? 'Bezig met versturen…' : 'Wijziging versturen'}
            </button>
            <Link
              href={`/entry/${id}`}
              style={{
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: colors.inkMuted,
                textDecoration: 'underline',
              }}
            >
              Annuleren
            </Link>
          </div>
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

function Veld({ label, value, onChange, placeholder }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, width: '100%' }}
      />
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
