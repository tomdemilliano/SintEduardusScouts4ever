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

## Nieuwe publieke pagina's

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
pages/index.js           Publieke galerij
pages/entry/[id].js       Publieke detailpagina per persoon
pages/beheer/login.js     Inlogpagina
pages/beheer/index.js     Overzicht: concepten + gepubliceerd
pages/beheer/upload.js    Nieuwe scan uploaden + herkennen
pages/beheer/[id].js      Bestaande entry bewerken
pages/api/extract.js      Server-route die Claude aanroept voor herkenning
```

## Uitgebreide tijdlijn (kentekens, mijlpalen, jaren-slider)

De tijdlijn (`/tijdlijn`) toont nu, naast de leden, ook:
- **Jaarkentekens**: één afbeelding + jaarleuze per werkingsjaar (start
  september), beheerd via `/beheer/kentekens`.
- **Mijlpalen**: belangrijke momenten uit de geschiedenis van de groep
  (🚩) of van de scoutsbeweging in het algemeen (⚜️, fleur-de-lis — het
  klassieke scoutssymbool, geen merklogo), beheerd via `/beheer/mijlpalen`.
  Bezoekers kunnen zelf een mijlpaal voorstellen via `/mijlpaal-toevoegen`
  (zonder in te loggen, met e-mailadres + een rekensom + honeypot tegen
  bots, en een keuze tussen de twee soorten). Een voorstel komt binnen met
  status `pending` en verschijnt pas publiek nadat de beheerder het
  goedkeurt op `/beheer/mijlpalen`. Op de tijdlijn staan de twee soorten
  in aparte rijen, zodat het onderscheid meteen duidelijk is.
- **Custom jaren-slider**: de tijdlijn is nu vast en breed (1944 tot nu,
  22px per jaar), met een eigen gestileerde schuifbalk bovenaan in plaats
  van de browser-scrollbar. Slepen aan de schuifbalk en horizontaal
  scrollen/swipen in de tijdlijn zelf blijven allebei gesynchroniseerd
  werken.

Nieuwe Firestore-collecties: `badges` (kentekens, publiek leesbaar) en
`milestones` (mijlpalen, enkel gepubliceerde zijn publiek leesbaar — zie
`firestore.rules`). Afbeeldingen komen terecht onder
`vriendenboekje/kentekens/...` en `vriendenboekje/mijlpalen/...` in de
gedeelde Storage-bucket; de storage-regel voor `vriendenboekje/` is
verbreed naar alle submappen (`{allPaths=**}`) zodat dit meteen werkt.



- PDF's worden rechtstreeks naar Claude gestuurd (geen aparte
  PDF-naar-afbeelding conversie nodig); voor foto's (jpg/png) werkt het
  ook direct.
- Elke herkenning is een los API-verzoek — geen data wordt bewaard door
  Anthropic buiten het beantwoorden van dat ene verzoek.
- Wil je meerdere beheerders met verschillende rechten, of scans in bulk
  uploaden in plaats van één voor één? Dat is een kleine uitbreiding op
  deze basis.
