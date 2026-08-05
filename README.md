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

### 1. Firebase project

Maak een Firebase project aan (of hergebruik een bestaand project zoals bij
Skippr/Winkelsimpel, met een apart project of aparte omgeving voor dit
vriendenboekje).

Activeer:
- **Firestore** (in productiemodus)
- **Storage**
- **Authentication** → provider **E-mail/wachtwoord**

Maak onder Authentication handmatig één (of meerdere) beheerder-accounts
aan — dit zijn de mensen die scans mogen uploaden en publiceren.

Deploy de meegeleverde regels:

```bash
firebase deploy --only firestore:rules,storage:rules
```

(`firestore.rules` en `storage.rules` staan in de root van dit project —
publiek lezen van gepubliceerde entries, schrijven enkel voor ingelogde
beheerders.)

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

## Structuur

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

## Notities

- PDF's worden rechtstreeks naar Claude gestuurd (geen aparte
  PDF-naar-afbeelding conversie nodig); voor foto's (jpg/png) werkt het
  ook direct.
- Elke herkenning is een los API-verzoek — geen data wordt bewaard door
  Anthropic buiten het beantwoorden van dat ene verzoek.
- Wil je meerdere beheerders met verschillende rechten, of scans in bulk
  uploaden in plaats van één voor één? Dat is een kleine uitbreiding op
  deze basis.
