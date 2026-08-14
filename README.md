# Vriendenboekje — oud-scouts reünie

Digitale versie van de ingevulde reünie-formuliertjes. Bezoekers bladeren
publiek door alle gepubliceerde entries; jij beheert de scans achter een
login op `/beheer`.

## Hoe het werkt

1. Log in op `/beheer/login` (zie hieronder voor het aanmaken van een account).
2. Ga naar `/beheer/upload`, kies een scan (foto of pdf), klik **"Tekst
   herkennen"** — Claude leest het handschrift en vult de velden in.
3. Corrigeer waar nodig en klik **"Opslaan als concept"**.
4. Op `/beheer` zie je alle concepten en gepubliceerde entries. Klik
   **"Publiceren"** zodra een entry klaar is — pas dan verschijnt hij
   publiek op `/`.

## Setup

### 1. Firebase project — hergebruikt vanuit Winkelsimpel

Dit project draait binnen het **bestaande Winkelsimpel Firebase-project**,
maar volledig gescheiden van Winkelsimpel's eigen data:

- **Firestore**: een aparte, named database `sinteduardusscouts4ever`
  (niet de `(default)` database die Winkelsimpel gebruikt) — volledig
  gescheiden collecties, indexes en rules.
- **Storage**: dezelfde bucket als Winkelsimpel, maar alle bestanden staan
  onder de folder-prefix `vriendenboekje/scans/...`, zodat er geen overlap
  is met Winkelsimpel's eigen bestanden.
- **Authentication**: dezelfde gebruikerspool als Winkelsimpel (Auth is
  project-breed, niet per database). Zorg dat de rules (zie hieronder)
  enkel de juiste mensen schrijftoegang geven tot het vriendenboekje.

Activeer indien nog niet gebeurd:
- **Authentication** → provider **E-mail/wachtwoord**
- Maak handmatig één (of meerdere) beheerder-accounts aan — dit zijn de
  mensen die scans mogen uploaden en publiceren.

#### Firestore rules deployen (naar de named database)

```bash
firebase use <jouw-winkelsimpel-project-id>
firebase deploy --only firestore:rules --config firebase.json
```

Dankzij de `"database": "sinteduardusscouts4ever"` in `firebase.json`
gaan deze rules naar de juiste database, en blijft Winkelsimpel's eigen
`(default)`-database met zijn eigen rules onaangeroerd.

#### Storage rules

`storage.rules` in dit project bevat al je **volledige Winkelsimpel-regels**
plús het nieuwe `vriendenboekje/scans/{fileName}`-blok eraan toegevoegd.
Zet dit bestand in je Winkelsimpel-repo (overschrijft daar het huidige
`storage.rules`) en deploy vanuit die kant:

```bash
firebase deploy --only storage:rules
```

### 2. Environment variables

Maak een `.env.local` aan:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

ANTHROPIC_API_KEY=sk-ant-...
```

De Anthropic API key blijft server-side (enkel gebruikt in
`pages/api/extract.js`) en wordt dus nooit naar de browser gestuurd.

### 3. Lokaal draaien

```bash
npm install
npm run dev
```

### 4. Deployen op Vercel

- Push naar GitHub, importeer het project in Vercel.
- Zet dezelfde environment variables in Vercel (Project Settings →
  Environment Variables).
- Vercel bouwt en deployt automatisch bij elke push.

## Meerdere scans in één keer

`/beheer/bulk-upload` — kies al je scans tegelijk (bv. de 75 ingescande
pagina's), elke scan wordt automatisch herkend en als concept opgeslagen
(3 tegelijk verwerkt om het niet te lang te laten duren). Nakijken en
publiceren doe je nadien per formulier, zoals gewoonlijk via `/beheer`.

## Filters in het beheeroverzicht

Op `/beheer` kan je filteren op:
- **Status** — alle / enkel concepten / enkel gepubliceerd
- **Kampplaats** — alle / enkel entries waarvan de kampplaats nog niet
  gekoppeld is aan de kaart (handig om systematisch `/beheer/locaties`
  te doorlopen)

Elke rij toont ook meteen of de kampplaats gekoppeld is (📍 gekoppeld,
⚠ niet gekoppeld, of geen kampplaats ingevuld).



- **`/tijdlijn`** — iedereen chronologisch gegroepeerd op het eerste
  jaartal uit hun opgegeven periode (bv. "1952 - 1955" → 1952).
- **`/kampplaatsen`** — gegroepeerd overzicht van alle opgegeven beste
  kampplaatsen, met een kaart met pins voor plaatsen die je gekoppeld
  hebt via `/beheer/locaties`.
- **`/eten`** — woordenwolk op basis van het lekkerste kamp-eten.
- **`/spellen`** — gegroepeerd overzicht van de plezantste spelen /
  strafste activiteiten.

### Kampplaatsen koppelen aan de kaart

Ga naar `/beheer/locaties` (achter dezelfde login), zoek elke kampplaats
op via de ingebouwde zoekfunctie (gebruikt OpenStreetMap/Nominatim, geen
API-key nodig) en kies het juiste resultaat. Plaatsen die je niet koppelt
verschijnen gewoon niet op de kaart, maar wel in de tekstlijst.

## Zelf toevoegen (publiek formulier)

`/toevoegen` — voor mensen die geen papieren formulier invulden op de
reünie maar toch in het vriendenboekje willen. Dezelfde vragen als op het
scanformulier, zonder scan-upload uiteraard.

Bot-wering: een verborgen honeypot-veld (bots vullen dit vaak automatisch
in, mensen zien het niet) plus een simpele rekensom. Dit is bewust
lichtgewicht — geen externe dienst zoals reCAPTCHA nodig — omdat de
echte garantie de handmatige goedkeuring is: elke inzending komt als
**concept** binnen op `/beheer`, exact zoals een geüploade scan, en wordt
pas publiek zichtbaar nadat jij ze publiceert.

`firestore.rules` staat een niet-ingelogde bezoeker toe om een nieuwe
entry aan te maken, maar enkel als concept, zonder scan, en met beperkte
veldgroottes — lezen, bewerken of verwijderen kan een bezoeker niet.

## Nieuwe Firestore-collectie

Naast `entries` is er nu ook een `locations`-collectie
(kampplaats-naam → lat/lng), publiek leesbaar, enkel beheerders kunnen
schrijven. Zit al verwerkt in `firestore.rules`.



```
lib/firebase.js       Firebase client init
lib/auth.js            Login/logout voor beheerders
lib/dbSchema.js         Factory-pattern: alle Firestore/Storage-toegang
lib/theme.js            Design tokens (kleuren, fonts)
components/EntryForm.js Herbruikbaar upload+bewerk-formulier
components/RequireAuth.js Schermt /beheer-pagina's af
pages/index.js           Landingspagina (logo, intro, navigatieknoppen)
pages/vriendenboekje.js  Publieke galerij (voorheen op /)
pages/entry/[id].js       Publieke detailpagina per persoon
pages/beheer/login.js     Inlogpagina
pages/beheer/index.js     Overzicht: concepten + gepubliceerd
pages/beheer/upload.js    Nieuwe scan uploaden + herkennen
pages/beheer/[id].js      Bestaande entry bewerken
pages/api/extract.js      Server-route die Claude aanroept voor herkenning
```

## Notities

- PDF's worden rechtstreeks naar Claude gestuurd (geen aparte
  PDF-naar-afbeelding conversie nodig); voor foto's (jpg/png) werkt het
  ook direct.
- Elke herkenning is een los API-verzoek — geen data wordt bewaard door
  Anthropic buiten het beantwoorden van dat ene verzoek.
- Wil je meerdere beheerders met verschillende rechten, of scans in bulk
  uploaden in plaats van één voor één? Dat is een kleine uitbreiding op
  deze basis.
