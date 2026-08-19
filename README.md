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

## Extra kampplaatsen (los van de "likes")

Belangrijk onderscheid: de kampplaatsen die uit de vriendenboekje-formulieren
komen (`besteKampplaats`) blijven de "leukste" kampplaatsen — die tellingen
zijn eigenlijk likes/stemmen, en dat blijft zo op `/kampplaatsen` (❤️-icoon,
kampvuur-oranje pins).

Daarnaast is er nu een volledig los systeem voor **extra kampplaatsen**,
zonder stem-telling:
- **Beheerder**: `/beheer/extra-locaties` — direct toevoegen (meteen
  gepubliceerd) met naam, beschrijving en optioneel coördinaten (zoeken of
  op kaart aanklikken, zelfde manier als bij `/beheer/locaties`).
- **Bezoeker**: `/kampplaats-toevoegen` — naam, beschrijving en verplicht
  e-mailadres, met dezelfde rekensom + honeypot-beveiliging als bij de
  andere publieke formulieren. De ingevulde naam dient meteen als
  zoekfilter voor een kaart (OpenStreetMap/Nominatim), zodat de bezoeker
  zelf al de juiste plek kan aanklikken. Komt binnen als `pending` — met
  of zonder coördinaten — en wordt pas publiek zichtbaar na goedkeuring
  door de beheerder.

Op `/kampplaatsen` staan beide soorten duidelijk gescheiden: de "leukste"
lijst met ❤️-tellingen bovenaan, en een aparte "extra getipte plekken"-lijst
eronder, met een legende bij de kaart die de kleuren uitlegt.

Nieuwe Firestore-collectie: `extraLocations` (zie `firestore.rules`).

## Nieuwe Firestore-collectie (kampplaatsen op de kaart)

Naast `entries` is er ook een `locations`-collectie (kampplaats-naam →
lat/lng, voor de "leukste kampplaatsen"-koppeling), publiek leesbaar, enkel
beheerders kunnen schrijven. Zit al verwerkt in `firestore.rules`.

```
lib/firebase.js       Firebase client init
lib/auth.js            Login/logout voor beheerders
lib/dbSchema.js         Factory-pattern: alle Firestore/Storage-toegang
lib/theme.js            Design tokens (kleuren, fonts)
components/EntryForm.js Herbruikbaar upload+bewerk-formulier
components/RequireAuth.js Schermt /beheer-pagina's af, toont AdminNav
components/AdminNav.js    Hoofdnavigatie binnen /beheer
components/AdminSubNav.js Sub-tabs binnen een beheersectie
pages/index.js           Publieke galerij
pages/entry/[id].js       Publieke detailpagina per persoon
```

## Beheer-structuur (bijgewerkt)

Het beheergedeelte is heringedeeld in duidelijke secties, met een vaste
navigatiebalk (`components/AdminNav.js`) bovenaan elke `/beheer/*`-pagina:

```
/beheer                        Dashboard: statistieken + "te behandelen"
/beheer/vriendenboek           Overzicht van alle formulieren (was: /beheer)
/beheer/vriendenboek/upload        + Eén scan
/beheer/vriendenboek/bulk-upload   + Meerdere scans
/beheer/vriendenboek/[id]          Een formulier bewerken
/beheer/kampplaatsen           Kampplaatsen uit de vriendenboekjes koppelen
/beheer/kampplaatsen/extra         Extra/voorgestelde kampplaatsen
/beheer/tijdlijn                Mijlpalen beheren/goedkeuren
/beheer/tijdlijn/kentekens          Jaarkentekens beheren
/beheer/gerechten               Gerechten & recepten
/beheer/links                   Links beheren
/beheer/login                   Inloggen
```

Secties met meerdere sub-pagina's (Vriendenboek, Kampplaatsen, Tijdlijn)
tonen ook nog een rij tabbladen (`components/AdminSubNav.js`) om tussen
hun eigen sub-pagina's te wisselen.

Het **dashboard** op `/beheer` haalt statistieken op over alle onderdelen
en toont een "Te behandelen"-lijst met alles wat nog actie nodig heeft:
concept-formulieren, niet-gekoppelde kampplaatsen, nog goed te keuren
extra kampplaatsen en mijlpalen, en een ontbrekend jaarkenteken voor het
huidige werkingsjaar. Is er niets te doen, dan verschijnt gewoon een
🎉-melding.



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

## Foto's (echte upload naar Firebase Storage)

Foto's worden rechtstreeks geüpload naar Firebase Storage (onder
`vriendenboekje/fotos/...`, publiek leesbaar) — geen externe links meer
naar Drive/OneDrive nodig. Elke foto is een los Firestore-document met
eigen, optionele tags.

**Automatische verkleining vóór het uploaden**: `lib/utils.js` bevat
`resizeImageFile()`, die elke foto client-side (via canvas) herschaalt
naar max. 1600px op de langste zijde en als JPEG (~82% kwaliteit)
comprimeert, vóór hij naar Storage gaat. Dat houdt opslag- en
downloadkosten laag en de galerij vlot, ook bij rechtstreeks van een
telefoon geüploade foto's.

- **Beheerder**: `/beheer/fotos` (overzicht, goedkeuren, verwijder-
  verzoeken afhandelen) en `/beheer/fotos/toevoegen` (bulk: kies zoveel
  foto's als je wil in één keer, ze worden verkleind + geüpload + meteen
  gepubliceerd, met optioneel een gedeeld jaar/locatie voor de hele
  selectie, en een statuslijst per foto tijdens het verwerken).
- **Bezoeker**: `/foto-toevoegen` (ook in bulk, met e-mailadres + rekensom
  + honeypot, komt binnen als `pending`) en `/fotos` (bladeren, filteren
  op jaar/locatie/naam, filter "nog niet getagd").
- **Crowdsourced taggen**: op `/fotos/[id]` kan **iedereen**, zonder in te
  loggen, het jaar, de locatie en wie erop staat aanpassen op een reeds
  gepubliceerde foto — bewust zonder goedkeuringsstap, want anders is
  "help mee sorteren" bij een hele map door-elkaar-foto's niet haalbaar.
  Een **verwijderverzoek** ("hoort hier niet thuis") is wel gewoon een
  vlag die de beheerder moet bevestigen — dat is destructief, dus dat
  blijft beheerder-only. Verwijdert de beheerder een foto definitief, dan
  wordt ook het bestand in Storage mee opgeruimd.
- **Leden taggen**: `components/MemberTagPicker.js` zoekt in de bestaande
  gepubliceerde vriendenboekje-namen (klik om te koppelen aan het profiel)
  of laat een vrije naam toe (Enter) voor wie niet in het vriendenboekje
  staat.
- **Extra info per foto**: een los `beschrijving`-veld, aan te vullen op
  dezelfde manier als jaar/locatie (crowdsourced, zonder goedkeuring).
- **Koppeling met het vriendenboekje**: elk lid-profiel (`/entry/[id]`)
  toont onderaan een fotogalerij met alle foto's waarop die persoon getagd
  is (via `PhotoFactory.getByEntryId`, gebaseerd op het `taggedEntryIds`-
  veld). Op het overzicht (`/vriendenboekje`) krijgt elke kaart een klein
  📷-icoontje met het aantal foto's waarin die persoon getagd is.

Nieuwe Firestore-collectie: `photos` (velden `afbeeldingUrl` +
`afbeeldingPath`, i.p.v. een externe `url`). De rules zijn hier het meest
uitgebreid van de hele app: publieke *create* is beperkt (altijd
`pending`), publieke *update* mag enkel op een reeds gepubliceerde foto en
enkel de tag-velden wijzigen (`afbeeldingUrl`, `afbeeldingPath`,
`contactEmail`, `status`, `createdAt` moeten identiek blijven).

**Storage-rules**: `vriendenboekje/fotos/{fileName}` staat, als enige plek
in de hele app, toe dat **niet-ingelogde bezoekers zelf een nieuw bestand
uploaden** — noodzakelijk voor de publieke inzending. Dat is begrensd tot
afbeeldingen onder de 8MB; bestaande bestanden overschrijven of
verwijderen kan enkel als beheerder. De echte inhoudelijke controle zit in
de goedkeuringsstap (Firestore `status: 'pending'`), niet in de
Storage-regel zelf.
