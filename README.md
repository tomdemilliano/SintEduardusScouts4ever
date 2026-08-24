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

## Foto-tags (categorieën)

Los van de vrije jaar/locatie/leden-tags is er een gecontroleerde lijst
categorieën ("tags"), bv. "Kampvuur", "Groepsfoto", "Zwemmen":

- **Aanmaken**: enkel de beheerder, via `/beheer/fotos/tags` — dit
  voorkomt een wildgroei aan bijna-identieke tags.
- **Toekennen**: zowel beheerder als bezoeker mogen bestaande tags aan een
  foto koppelen (`components/PhotoTagSelector.js`), net als de andere
  foto-tags, zonder goedkeuringsstap.
- **Filteren**: `components/TagFilterPicker.js` is een compacte,
  uitklapbare multi-select (één knopje met een aantal-badge) — neemt zo
  weinig mogelijk ruimte in, ook op mobiel, ongeacht hoeveel tags er zijn.
  Staat op zowel `/fotos` (publiek) als `/beheer/fotos` (beheer), en werkt
  samen met de bestaande filters (jaar, locatie, "nog niet getagd") via
  EN-logica: hoe meer filters actief, hoe specifieker het resultaat.

Nieuwe Firestore-collectie: `photoTags` (publiek leesbaar, enkel
beheerder schrijft). Foto's kregen er een `tagIds`-veld bij (array van
tag-ID's), mee opgenomen in de publieke tag-update-regel.

## Extra beveiliging + foto's draaien

- **Publiek: bewerken achter een knop.** Op `/fotos/[id]` worden jaar,
  locatie, wie erop staat, categorie en extra info nu standaard als
  gewone leestekst getoond. Pas na een klik op "✏️ Bewerken" verschijnt
  het invulformulier, met een expliciete "Opslaan"/"Annuleren". Dat
  voorkomt onbedoelde wijzigingen door per ongeluk te klikken/typen in
  een veld dat toch al bewerkbaar stond.
- **Foto draaien** (90° per klik, zowel in `/beheer/fotos` als op
  `/fotos/[id]`, enkel zichtbaar in bewerk-modus): dit is een échte
  pixel-rotatie via canvas (`lib/utils.js` → `rotateImageFile`), geen
  CSS-transform. Het resultaat wordt als nieuw bestand naar Storage
  geüpload en vervangt de oude `afbeeldingUrl`/`afbeeldingPath`
  (`PhotoFactory.replaceImage`), zodat de gedraaide foto meteen overal
  correct verschijnt — kaartjes, profielpagina's, gedeelde links — zonder
  dat elke plek waar een foto getoond wordt aparte rotatielogica nodig heeft.

  Om dit publiek mogelijk te maken, staat de update-rule in
  `firestore.rules` toe dat `afbeeldingUrl`/`afbeeldingPath` wijzigen,
  maar enkel naar een pad onder `vriendenboekje/fotos/` in Storage — geen
  willekeurige externe URL. Kanttekening: de Storage-rule laat enkel
  ingelogde beheerders oude bestanden effectief verwijderen; draait een
  bezoeker een foto, dan blijft het oude (vervangen) bestand in Storage
  staan. Dat kost wat extra opslag, maar breekt niets — het is puur een
  opruim-detail dat de beheerder eventueel manueel kan doen via de
  Firebase-console.

## Leidingsploegen per tak, per werkingsjaar

Nieuw op de tijdlijn: de leidingsploeg per tak (Kapoenen, Welpen,
Jonggivers…) per werkingsjaar. Dit is, net als de kentekens, **enkel door
de beheerder** in te vullen — geen crowdsourced bewerking door bezoekers,
want dit is officiële historiek.

- **`/beheer/tijdlijn/takken`** — de lijst van takken/groepen beheren
  (aanmaken/hernoemen/verwijderen). Dit is de gecontroleerde lijst
  waaruit gekozen wordt bij het invullen van een leidingsploeg.
- **`/beheer/tijdlijn/leiding`** — per combinatie tak + werkingsjaar de
  leiding invullen (zoeken/selecteren uit de bestaande leden via
  `MemberTagPicker`, of een vrije naam voor wie niet in het
  vriendenboekje staat). Overzicht gegroepeerd per werkingsjaar, met
  bewerken/verwijderen.

**Weergave op de tijdlijn — bewust compact:** in plaats van de volledige
leidingsploeg voortdurend zichtbaar te maken (wat al snel te druk zou
worden bij meerdere takken over tientallen jaren), staat er één extra,
smalle rij "👥 Leiding" met simpele bolletjes — één per werkingsjaar
waarvoor er gegevens zijn. Een klik op zo'n bolletje opent een
detailkaart (tussen de twee scroll-boxen, net als bij kentekens en
mijlpalen) met alle takken van dat werkingsjaar en hun volledige
leidingsploeg als naam-badges. Zo blijft de tijdlijn zelf overzichtelijk,
terwijl de volledige info één klik verwijderd is.

Nieuwe Firestore-collecties: `scoutTakken` en `leidingsploegen` (beide
publiek leesbaar, enkel beheerder schrijft — zie `firestore.rules`).

## Update: leidingsploegen — nu crowdsourced en met een eigen vak

Drie aanpassingen op de eerdere leidingsploeg-functie:

1. **Crowdsourced, net als de foto's.** Iedereen mag, zonder in te loggen,
   een leidingsploeg voor een tak+werkingsjaar toevoegen of corrigeren
   (`firestore.rules`: `leidingsploegen` staat nu publieke `create`/
   `update` toe, met basisvalidatie). Enkel het **verwijderen** van een
   document blijft beheerder-only — een foutieve inzending corrigeer je
   door de juiste namen opnieuw op te slaan, niet door te verwijderen.
   De takken-lijst zelf blijft wel beheerder-only (om wildgroei te
   vermijden), en de **volgorde** van de takken is nu ook door de
   beheerder instelbaar via pijltjes-knoppen op `/beheer/tijdlijn/takken`.

2. **Eigen, apart vak op de tijdlijn.** In plaats van één smalle rij met
   jaar-bolletjes staat er nu een volledig apart kader **"Leidingsploegen
   per tak"**, met per tak (in de door de beheerder bepaalde volgorde)
   een eigen rij met bolletjes op de jaren waarvoor er gegevens zijn. Dit
   vak scrollt gesynchroniseerd mee met de rest van de tijdlijn (dezelfde
   custom slider). Een klik op een bolletje opent een detailkaart met de
   ploeg van die tak in dat jaar — inclusief dezelfde "eerst lezen, dan
   pas bewerken"-beveiliging als bij de foto's, om onbedoelde wijzigingen
   te vermijden. Er staat ook een duidelijke **"+ Leidingsploeg
   toevoegen"**-knop bovenaan dat vak voor nieuwe combinaties.

3. **Op het profiel van een lid** (`/entry/[id]`) staat nu een "👥
   Leiding"-lijstje met alle tak+werkingsjaar-combinaties waarin die
   persoon in de leidingsploeg zat (nieuwste eerst).

## Kleine tijdlijn-verfijningen

- **Ademruimte voor labels**: de tekst/emoji's van de rij-labels (🧭
  Kentekens, ⚜️ Scouting, tak-namen, ledennamen…) plakten tegen de
  linkerrand van elk kader. Er staat nu een kleine binnenmarge tussen.
- **Geselecteerd jaar zichtbaar bij de slider**: onder de custom
  jaren-slider staat nu, in het midden, groot en in kampvuur-oranje, het
  jaar dat overeenkomt met de huidige scrollpositie — bijgewerkt zowel
  tijdens het slepen aan de slider als bij rechtstreeks scrollen in een
  van de kaders.
- **Verticale jaarlijn**: datzelfde jaar wordt ook als een dunne,
  halfdoorzichtige verticale lijn getoond in alle drie de kaders
  (kentekens/mijlpalen, leidingsploegen, leden), zodat je in één oogopslag
  ziet welk jaartal overeenkomt met wat er net zichtbaar is.

## Bugfix: foto draaien gaf een CORS-fout

Firebase Storage staat standaard niet toe dat de browser de ruwe pixels
van een afbeelding op een ander domein rechtstreeks in een canvas inleest
(nodig om te kunnen draaien) — dat vereist normaal een aparte CORS-
configuratie op de Storage-bucket zelf via de Google Cloud CLI
(`gsutil cors set`), buiten `firestore.rules`/`storage.rules` om.

In plaats daarvan lost `pages/api/proxy-image.js` dit op binnen de app
zelf: een kleine server-route die de afbeelding server-side ophaalt (waar
geen CORS-beperking geldt) en teruggeeft aan de browser. Voor de browser
is de afbeelding dan "same-origin", en kan `rotateImageFile` (in
`lib/utils.js`) ze gewoon inlezen. De route accepteert enkel URL's van
`firebasestorage.googleapis.com`, zodat ze niet als open proxy voor
andere sites misbruikt kan worden.

## Foto's: categorieën altijd zichtbaar (responsief)

Op `/fotos` staat de tag-filter niet langer standaard achter het
uitklap-knopje verstopt:

- **Groter scherm (breder dan 680px)**: een vaste kolom links met alle
  categorieën in één oogopslag, elk aanklikbaar (meerdere tegelijk
  mogelijk). Geen extra klik nodig om te zien wat er beschikbaar is.
- **Mobiel (smaller dan 680px)**: de kolom zou te veel ruimte innemen,
  dus daar valt het automatisch terug op het bestaande, compacte
  `TagFilterPicker`-knopje bij de andere filters.

Beide bedienen dezelfde `tagFilter`-state, dus de knop en de kolom geven
altijd hetzelfde resultaat — het is puur een kwestie van welke van de
twee zichtbaar is, geregeld via een CSS media query (`@media (max-width:
680px)` in `pages/fotos.js`) in plaats van JavaScript-schermbreedte-
detectie, om een hydration-mismatch tussen server en browser te vermijden.

## Bugfix: sortering en navigatie foto's kwamen niet overeen

Twee samenhangende problemen:
- Het overzicht (`/fotos`) toonde de foto's in de onbepaalde volgorde die
  Firestore toevallig teruggaf (geen `orderBy`), wat willekeurig aanvoelde.
- Vorige/volgende op de detailpagina volgde altijd *alle* gepubliceerde
  foto's op datum, zonder rekening te houden met een filter dat je net op
  het overzicht had ingesteld — dus de volgorde bij het doorklikken kwam
  niet overeen met wat je net zag, en filters werden genegeerd.

Oplossing:
- `/fotos` sorteert nu altijd expliciet op **nieuwste eerst**
  (`createdAt`), voor een voorspelbare volgorde.
- Bij elke wijziging van de filters slaat `/fotos` de **exacte, gefilterde
  lijst foto-ID's** op in `sessionStorage` (`vb-fotos-volgorde`).
- `/fotos/[id]` leest die lijst in bij het openen en gebruikt ze voor
  vorige/volgende, zodat je door precies dezelfde (eventueel gefilterde)
  set foto's bladert als op het overzicht. Kwam je niet via het overzicht
  binnen (bv. een gedeelde link), dan valt de detailpagina netjes terug op
  alle gepubliceerde foto's, gesorteerd op datum.

## Drie nieuwe beheerfuncties

### 1. Dubbele/gelijkaardige foto's opsporen

`/beheer/fotos/dubbels` — vergelijkt alle gepubliceerde foto's op
**visuele gelijkenis**, niet enkel op identieke bestanden. Elke foto
krijgt bij het opladen een "dHash" (difference hash — `lib/utils.js`,
`berekenBeeldHash*`): een korte vingerafdruk berekend via canvas, die
weinig verandert bij lichte compressie/verkleining maar wél verschilt bij
een écht andere foto. Twee foto's met een kleine "Hamming-afstand" tussen
hun hash zijn hoogstwaarschijnlijk dezelfde foto (of een variant ervan).

Bestaande foto's (van vóór deze functie) krijgen hun hash pas bij de
eerste scan — die berekent en bewaart 'm dan meteen, zodat een volgende
scan sneller gaat. Gevonden groepen gelijkende foto's worden naast elkaar
getoond, met een verwijderknop per foto.

### 2. Bezoekerstatistieken

`/beheer/statistieken` — bewust lichtgewicht en privacyvriendelijk: geen
individuele bezoek-logs, IP-adressen of langdurige tracking, enkel een
teller per (dag, pagina)-combinatie (`StatsFactory`, collectie
`statistieken`), opgeteld via Firestore's `increment()`. Elke publieke
paginaweergave (niet het beheergedeelte zelf) telt automatisch mee via
`pages/_app.js`. Het scherm toont het totaal, een balkje per dag
(laatste 30 dagen) en de meest bezochte pagina's.

### 3. Getagde personen zonder vriendenboekje-fiche → "stub"-oudleden

Tot nu toe verdween een vrij getypte naam bij het taggen (in foto's of
leidingsploegen) na het opslaan — je moest 'm bij een volgende foto
opnieuw intypen. Nu maakt `EntryFactory.findOrCreateStub()` daar
automatisch een minimale entry van (enkel een naam, status `'stub'`),
die nadien **hergevonden** wordt via dezelfde zoekfunctie
(`MemberTagPicker`) in plaats van dubbel aangemaakt te worden.

- **Publiek**: `/vriendenboekje` heeft nu twee tabbladen — "Leden" (zoals
  voordien) en **"Getagd, geen eigen fiche"**, met daarin deze
  stub-personen, telkens met het aantal foto's en/of leidingsploegen
  waarin ze voorkomen. Hun profielpagina (`/entry/[id]`) toont gewoon de
  foto's/leiding-lijst, met een duidelijke melding + link naar
  `/toevoegen` voor wie zichzelf of iemand anders alsnog een echte fiche
  wil geven.
- **Beheer**: `/beheer/vriendenboek` heeft een extra statusfilter "Getagd,
  geen fiche", zodat je deze stub-personen kan terugvinden en (via het
  gewone bewerkscherm) alsnog kan aanvullen en publiceren — dat verandert
  hun status gewoon naar `'published'`, geen aparte flow nodig.

**Firestore-rules**: `entries` is nu ook publiek leesbaar voor
`status == 'stub'`, en er is een nieuwe, beperkte publieke create-regel
die enkel een naam toestaat (geen scan, geen andere velden) voor deze
automatische aanmaak zonder login.

## Bijkomend: bestaande niet-gekoppelde tags opruimen + koppeling-bevestiging

Vervolg op de stub-oudleden-functie:

- **`/beheer/vriendenboek/koppelen`** (nieuw tabblad) — scant alle foto's
  en leidingsploegen op vrij getypte namen zonder `entryId` (van vóór
  `MemberTagPicker` automatisch een stub-fiche aanmaakte). Voor elke
  gevonden naam kan je ofwel koppelen aan een bestaand lid (zoekfunctie,
  handig bij een licht andere schrijfwijze) ofwel een nieuwe stub-fiche
  laten aanmaken — in beide gevallen worden **alle** foto's/
  leidingsploegen met die naam in één keer mee bijgewerkt
  (`PhotoFactory.linkLedenTagNaam`, `LeidingFactory.linkLedenNaam` — deze
  raken bewust enkel het ledenTags/leden-veld, niets anders).

- **"Ben jij misschien X?" op `/toevoegen`** — terwijl iemand zijn naam
  intypt, wordt (met een korte vertraging) gecontroleerd of er al een
  stub-fiche met een gelijkaardige naam bestaat. Bij bevestiging wordt
  niet een nieuwe, dubbele entry aangemaakt, maar de bestaande stub-fiche
  bijgewerkt (`EntryFactory.upgradeStubMetFormulier`) — alle foto's/
  leidingsploegen die er al naar verwezen, blijven dus automatisch
  gekoppeld. Status wordt `'draft'`, met een nieuw veld
  `koppelingBevestigd: false`.

- **Expliciete beheerdersgoedkeuring van de koppeling** — op
  `/beheer/vriendenboek/[id]` zie je, als een lid al getagd is in
  foto's/leidingsploegen, hoeveel er dat zijn, met een aparte
  "✓ Ja, dit is dezelfde persoon"-knop. Zolang die niet is ingedrukt (bij
  een via `/toevoegen` bevestigde koppeling staat dit standaard nog
  open), blijft de "Publiceren"-knop uitgeschakeld — zo kan een verkeerd
  bevestigde naamgelijkenis nooit ongemerkt gepubliceerd worden.

**Firestore-rules**: een nieuwe publieke *update*-regel voor `entries`
(enkel de overgang `stub` → `draft`, met `koppelingBevestigd` verplicht
op `false`) — opnieuw deployen.

## Bugfix/hersteltool: per ongeluk gepubliceerde stub-fiches terugzetten

Op `/beheer/vriendenboek/koppelen` staat nu, bovenaan, een aparte sectie
**"Lijkt op per ongeluk gepubliceerd"**. Die herkent gepubliceerde entries
die op een leeggebleven stub lijken (geen geboortejaar, totemnaam,
periode, activiteiten, kampplaats, eten of scan — enkel een naam), met
zowel een knop per fiche als een "Alles terugzetten"-knop om ze in bulk
terug naar status `'stub'` te zetten. Zo verschijnen ze weer correct in
het "Getagd, geen eigen fiche"-tabblad i.p.v. tussen de echte,
gepubliceerde leden te staan.

Nieuwe functie: `EntryFactory.revertToStub(id)`.

## Verstrakking: stub-fiches kunnen niet meer per ongeluk gepubliceerd worden

- **"Niet-gekoppelde tags"-tabblad verwijderd** — sinds `MemberTagPicker`
  altijd een entry-ID toekent (bestaand lid of nieuwe stub-fiche), kan
  deze situatie niet meer ontstaan. `/beheer/vriendenboek/koppelen`
  bestaat nog als vangnet (enkel de "per ongeluk gepubliceerd"-scan,
  zie vorige sectie), maar staat niet meer in de tabbladen — enkel nog
  rechtstreeks via de URL bereikbaar.
- **Bewerken/Publiceren/Depubliceren verwijderd voor stub-fiches** op
  `/beheer/vriendenboek`: voor een fiche met status `'stub'` blijft enkel
  **Verwijderen** over, zodat een stub niet per ongeluk bewerkt of
  gepubliceerd kan worden. (Het "ben jij misschien X?"-pad op `/toevoegen`
  blijft wél de normale, bedoelde manier om een stub naar een echte fiche
  te upgraden.)
- **Verwijderen van een stub is nu een cascade**: `EntryFactory.removeStub()`
  verwijdert niet enkel de fiche zelf, maar ook meteen de tag op elke
  foto (`PhotoFactory.removeEntryFromTags`) en de koppeling in elke
  leidingsploeg (`LeidingFactory.removeEntryFromAll`) — geen verweesde
  verwijzingen naar een niet meer bestaand lid.

## Contactformulier + kleine opruiming

- **"Reünie oud-scouts"-label verwijderd** van `/vriendenboekje` — de site
  is intussen veel meer dan enkel dat.
- **Nieuw contactsysteem**, zonder e-mail-infrastructuur nodig: berichten
  komen in een Firestore-collectie `contactBerichten` terecht (publiek
  enkel aan te maken, niet te lezen), en jij bekijkt/beheert ze via
  `/beheer/contact` (met een "nieuw"/"gelezen"-onderscheid, en een
  `mailto:`-link per bericht om er rechtstreeks op te antwoorden). Het
  dashboard toont ongelezen berichten ook in de "Te behandelen"-lijst.
- **`/contact`** (nieuw, publiek): een eenvoudig formulier (naam,
  e-mailadres, groep/gemeente, bericht), met dezelfde rekensom +
  honeypot-beveiliging als de andere publieke formulieren.
- **Prominente boodschap op de landingspagina**: een opvallend kader dat
  uitnodigt tot contact voor wie van een andere scoutsgroep is en ook zo'n
  website wil.
- **Subtiele contactlink op elke andere publieke pagina**: toegevoegd aan
  het gedeelde `PublicNav`-component (`ContactLink`), dus automatisch
  overal aanwezig zonder dat elke pagina apart aangepast moest worden.

Wil je dit later uitbreiden met een echte e-mailnotificatie bij een nieuw
bericht (bv. via Resend, zoals bij Winkelsimpel), dan is dat een kleine
uitbreiding bovenop `ContactFactory.create()` — voorlopig moet je gewoon
even op `/beheer/contact` gaan kijken.

## Kampplaatsen: compactere weergave + klik-naar-kaart

- **Compacte tegels i.p.v. brede kaarten**: elke kampplaats is nu een
  kleine, naast elkaar geplaatste tegel (naam + ❤️-aantal, of 📍 voor een
  extra plek) in plaats van een volle-breedte kaart per plek — veel minder
  scrollen om alles te zien. De namen van de vrienden die een plek als
  "beste kampplaats" kozen staan niet langer standaard zichtbaar; ze
  verschijnen als tooltip (onder elkaar) wanneer je over de tegel
  hovert.
- **Extra getipte plekken zijn zichtbaarder** simpelweg doordat de hele
  pagina nu veel korter is — de sectie staat niet langer ver weg onder een
  lange stapel kaarten, en gebruikt exact dezelfde, compacte tegelstijl
  als de "leukste kampplaatsen", dus ze vallen evenveel op.
- **Klikken op een naam licht de bijhorende pin uit op de kaart** (groter
  icoon, komt bovenop de andere pins te liggen, de kaart pant er zachtjes
  naartoe, en de popup opent automatisch). Nogmaals klikken op dezelfde
  tegel zet de markering weer uit.

Technisch: `components/CampMap.js` houdt de Leaflet-markers nu bij in een
`ref` en past bij een wijziging van de nieuwe `gemarkeerd`-prop enkel het
icoon van de betrokken marker aan, in plaats van de hele kaart (en dus
alle markers) opnieuw op te bouwen — dat voorkomt een merkbare
"flikker"/herlaad-hapering bij elke klik.

## Bugfix: nieuwe naam taggen lukte niet op mobiel

`MemberTagPicker` (gebruikt bij het taggen van personen op foto's en in
leidingsploegen) vertrouwde voor een vrij getypte, nieuwe naam volledig op
de Enter-toets. Op mobiel sturen virtuele toetsenborden de "Enter"/"Ga"-
knop echter niet altijd betrouwbaar door als een `keydown`-event, waardoor
er geen enkele manier was om zo'n naam toe te voegen.

Er staat nu een expliciete **"+ Toevoegen"**-knop naast het invoerveld —
Enter blijft ook gewoon werken (bv. op desktop), maar is niet langer de
enige weg.

## Foto's op decennium sorteren (nieuw)

Als een exact jaartal niet lukt, kan een foto voortaan aan een
**decennium** toegewezen worden, met een positie daarbinnen — zo ontstaat
toch een soort tijdlijn.

- **`/beheer/fotos/sorteren`** (nieuw tabblad): bovenaan een rij
  "nog niet gesorteerde" foto's, daaronder de decennium-vakken
  (jaren '40 t.e.m. het huidige decennium) waar je een foto naartoe kan
  **slepen**. Klik op een vak om het uit te klappen: de foto's erin kan
  je onderling **herschikken door te slepen** (vooraan = vroeger in dat
  decennium), en per foto is er een klein jaar-veldje (voor wie het toch
  nog exact weet), plus knopjes om naar het vorige/volgende decennium te
  verplaatsen of het decennium weer te verwijderen.
- **Nieuwe velden op een foto**: `decennium` (bv. `1970`) en
  `decenniumPositie` (een oplopend volgnummer binnen dat decennium, enkel
  gebruikt om te sorteren — geen zichtbaar getal).
- **Sortering overal chronologisch**: `/fotos` toont foto's nu op
  chronologische volgorde — exact jaartal waar gekend, anders een
  geschatte positie op basis van decennium + plaats daarbinnen, en foto's
  zonder enig tijdsgegeven helemaal achteraan. De reken-logica zit in
  `lib/utils.js` → `berekenFotoSorteerJaar()`.
- **Decennium ook los instelbaar** op de gewone bewerkschermen
  (`/fotos/[id]` en het admin-bewerkscherm), als alternatief voor een
  exact jaartal — verschijnt dan als "jaren '70" i.p.v. een jaartal, zowel
  op de kaartjes als in de detailweergave.

Firestore-rules: de publieke tag-bewerkingsregel staat nu ook
`decennium`/`decenniumPositie` toe (met dezelfde "mag ontbreken op oudere
foto's, maar moet het juiste type hebben"-aanpak als de andere velden).
Opnieuw deployen voor dit actief wordt.

## Op decennium sorteren: nu ook publiek

De decennium-sorteertool bestaat nu ook voor bezoekers, op **`/fotos/sorteren`**
(met een link vanaf `/fotos`), crowdsourced net als de andere foto-tags —
geen login nodig.

**Belangrijk verschil met de beheerversie**: de publieke versie gebruikt
bewust **geen slepen**, maar **tikken**: eerst een foto aantikken
(krijgt een groen kader), dan een decennium-vak aantikken om ze daar te
plaatsen. Native sleep-en-neerzet (drag-and-drop) werkt namelijk niet
betrouwbaar op mobiele toestellen, en aangezien dit publieke onderdeel
net zo goed — zoniet vooral — op een telefoon gebruikt zal worden, was
een tik-gebaseerde bediening de betere keuze. Binnen een uitgeklapt
decennium kan je met kleine ↑/↓-knopjes de volgorde verfijnen (vroeger/
later in dat decennium), en ◀▶✕ om naar een ander decennium te
verplaatsen of de toewijzing weer te verwijderen. Het beheer-scherm
(`/beheer/fotos/sorteren`) behoudt wel het slepen, aangezien dat in de
praktijk vooral op een desktop gebruikt wordt.

**Bugfix onderweg**: `PhotoFactory.zetDecennium` gebruikte intern een
ongefilterde query (`getAllAdmin()`) om de volgende positie te bepalen —
dat weigert Firestore voor een niet-ingelogde bezoeker zodra er ook
niet-gepubliceerde foto's in de collectie zitten. Aangepast naar
`getPublished()`, wat toch alles is wat nodig is om de positie te bepalen.

Geen wijziging aan `firestore.rules` nodig — de bestaande publieke
tag-bewerkingsregel liet `decennium`/`decenniumPositie` al toe.

## Foto-detailpagina: volledig scherm

Op `/fotos/[id]` staat nu een ⛶-knopje rechtsonder de foto om ze
**volledig scherm** te tonen (en ✕ of Escape om weer terug te gaan naar
het gewone formaat).

In volledig scherm staan rechtsboven, over de foto heen:
- 📍 de locatie (enkel als die gekend is)
- 👥 een badge met het aantal getagde personen — een klik opent een
  overlay met hun namen onder elkaar
- 🗓️ het jaartal, of anders het decennium, of anders "jaartal onbekend"
  als er nog niets ingevuld is
- ✕ om volledig scherm te sluiten

Links en rechts verschijnen (enkel als er een vorige/volgende foto is)
grote, halfdoorzichtige pijlen om verder te bladeren — dat blijft ook
gewoon **binnen** volledig scherm, en werkt ook via de pijltjestoetsen
(die daar al voor bestonden). Klikken op de donkere achtergrond zelf
sluit volledig scherm ook.

## Foto-overzicht: gegroepeerd per decennium

`/fotos` toont de (al chronologisch gesorteerde) foto's nu niet langer als
één lange, ongestructureerde rij, maar **gegroepeerd per decennium**:

- Tussen elk decennium staat een horizontale scheidingslijn met de titel
  ("jaren '70") in het midden, zodat je meteen ziet waar het ene
  decennium overgaat in het volgende.
- Foto's zonder enig tijdsgegeven (geen jaar, geen decennium) krijgen een
  eigen, duidelijk aparte groep **"🕓 Nog te dateren"** achteraan, i.p.v.
  ergens tussen de andere foto's te verdwijnen.
- Een compacte rij knopjes bovenaan (één per decennium/"onbekend", met
  aantal) laat toe om **direct naar een decennium te springen** (zachte
  scroll). Ik koos bewust voor deze aanpak i.p.v. een sleepbare
  jaren-slider (zoals op de hoofdtijdlijn) — een simpele knoppenrij werkt
  betrouwbaarder op mobiel en blijft in één oogopslag duidelijk. Zeg het
  gerust als je toch liever de sleep-slider-stijl van `/tijdlijn` hier
  ook wil, dat kan ik alsnog toevoegen.

De bestaande filters (jaar, locatie, tags, naam, "nog niet getagd")
blijven gewoon werken — de groepering gebeurt op de al gefilterde lijst,
dus een filter kan het aantal decennium-groepen gewoon verkleinen.

## Vriendenboekje: vorige/volgende navigatie

Op een profielpagina (`/entry/[id]`) staan nu, net onder de "terug naar
het vriendenboekje"-link, twee knoppen om door de leden te bladeren —
elk met de **naam** van de vorige/volgende persoon erop.

- Bij het **eerste lid** verschijnt enkel de "volgende"-knop (rechts),
  bij het **laatste lid** enkel "vorige" (links) — er is dan simpelweg
  niets om naartoe te navigeren aan die kant.
- De volgorde volgt exact wat de bezoeker op `/vriendenboekje` zag,
  inclusief een eventuele zoekfilter — zelfde patroon als de
  vorige/volgende-navigatie die al bij de foto's bestond
  (`sessionStorage`, ditmaal onder de sleutel `vb-leden-volgorde`).
- Kwam iemand rechtstreeks op een profiel terecht (bv. via een gedeelde
  link, zonder eerst het overzicht bezocht te hebben), dan verschijnen de
  knoppen gewoon niet — geen kapotte of lege navigatie.

## Foto's op een profielpagina: lichtbak i.p.v. wegnavigeren

Op `/entry/[id]` opende een klik op een foto voorheen `/fotos/[id]` — je
verliet dus meteen het vriendenboekje, en kon enkel via de browser-
"terug"-knop weer bij het profiel komen. Dat is nu een lichtbak
(overlay) die **op de profielpagina zelf blijft**:

- Klik op een foto → ze wordt groot getoond, met links/rechts-pijlen om
  door **enkel de foto's van deze persoon** te bladeren (ook via de
  pijltjestoetsen, en Escape om te sluiten).
- Rechtsboven: een ✕ om te sluiten, en een **"✏️ Bewerken ↗"**-link die
  wél naar de volledige foto-pagina gaat (waar je jaar/locatie/tags kan
  aanpassen) — maar in een **nieuw browsertabblad**, zodat het profiel
  op de achtergrond gewoon open blijft staan.
- Onderaan verschijnt, indien gekend, kort het jaartal/decennium en de
  locatie.

Dit hergebruikt bewust hetzelfde visuele patroon (donkere overlay,
ronde pijl-knoppen) als de volledig-scherm-weergave op `/fotos/[id]`,
voor een herkenbare ervaring doorheen de site.

## Activiteitenlog: zicht op publieke wijzigingen (nieuw)

`/beheer/activiteit` (nieuw, ook in de hoofdnavigatie) geeft je als
beheerder overzicht over wat bezoekers via crowdsourcing aanpassen —
zonder dat er ergens een account of persoonsgegeven van de bezoeker bij
wordt bijgehouden, enkel *wat* er veranderde en *wanneer*.

**Wat wordt gelogd** (telkens enkel bij een publieke, niet-ingelogde
actie — jouw eigen bewerkingen als beheerder tellen hier bewust niet in
mee):
- Foto's: tags bijgewerkt (jaar/locatie/leden/categorie), gedraaid,
  verwijdering aangevraagd, nieuwe foto's ingediend
- Leidingsploegen: nieuw toegevoegd of bijgewerkt
- Kampplaatsen: nieuwe plek voorgesteld
- Mijlpalen: nieuwe mijlpaal voorgesteld
- Vriendenboekje: nieuw formulier ingediend, of een stub-fiche gekoppeld
  via "ben jij misschien X?"

**Wat je op de pagina ziet**:
- Tellingen vandaag / deze week / deze maand / all-time
- Een balkje per dag voor de laatste 30 dagen (zelfde stijl als
  `/beheer/statistieken`), om de crowdsourcing-activiteit over tijd te
  volgen
- Verdeling per onderdeel (foto's, leiding, kampplaatsen, ...)
- Een filterbare, recente activiteitenlijst — bij foto's en
  vriendenboekje-fiches staat er een "bekijken →"-link (opent in een
  nieuw tabblad) om de gewijzigde foto/fiche meteen te controleren

**Technisch**: nieuwe Firestore-collectie `activiteiten`
(`ActivityFactory` in `lib/dbSchema.js`). Publiek mag enkel *aanmaken*
(met beperkte veldgroottes, geen IP/naam van de bezoeker); enkel de
beheerder mag het logboek lezen of opruimen. Het loggen zelf faalt nooit
zichtbaar voor de bezoeker (een mislukte log-poging wordt stilletjes
genegeerd, de eigenlijke actie van de bezoeker gaat gewoon door).

**Belangrijk**: `firestore.rules` moet opnieuw gedeployed worden voor de
nieuwe `activiteiten`-collectie actief wordt.
