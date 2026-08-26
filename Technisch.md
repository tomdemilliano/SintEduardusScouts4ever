# Technische documentatie — Vriendenboekje

Dit document beschrijft de opbouw van de toepassing: welke diensten
gebruikt worden, hoe je erbij kan, de structuur van de database, en de
opbouw van de code. Voor een gebruiksgerichte beschrijving van de site
zelf, zie **[README.md](./README.md)**.

---

## 1. Overzicht: welke diensten, en waar

| Onderdeel | Dienst | Waar te vinden / te beheren |
|---|---|---|
| **Domeinnaam** | `onsstamboek.be`, geregistreerd bij **Combell** | [my.combell.com](https://my.combell.com) — Domeinnamen → onsstamboek.be. DNS wijst via A-record (`@`) en CNAME (`www`) naar Vercel. |
| **Hosting / deployment** | **Vercel** | [vercel.com](https://vercel.com) — dashboard van het project. Elke push naar de gekoppelde Git-repository deployt automatisch. Domeinbeheer via Settings → Domains. |
| **Broncode** | Git-repository (GitHub of gelijkaardig) | Gekoppeld aan het Vercel-project; hier zit alle code die in dit document beschreven wordt. |
| **Database** | **Firebase Firestore** (NoSQL, document-georiënteerd) | [console.firebase.google.com](https://console.firebase.google.com) — project **Winkelsimpel**, named database `sinteduardusscouts4ever` (Firestore-tabblad → databaseselector rechtsboven). |
| **Bestandsopslag** | **Firebase Storage** | Zelfde Firebase-project, Storage-tabblad. Alle bestanden van deze site zitten onder het pad-voorvoegsel `vriendenboekje/` (gedeelde bucket met Winkelsimpel, netjes gescheiden per map). |
| **Inloggen (beheerder)** | **Firebase Authentication** | Zelfde Firebase-project, Authentication-tabblad — e-mail/wachtwoord. Nieuwe beheerder-accounts worden hier manueel aangemaakt. |
| **Tekstherkenning (OCR) van scans** | **Anthropic API** (Claude) | Server-route `pages/api/extract.js` roept de Anthropic API aan met een base64-scan en krijgt gestructureerde JSON terug (activiteiten/kampplaatsen/eten). Vereist een `ANTHROPIC_API_KEY`-omgevingsvariabele in Vercel. |
| **Kaarten** | **OpenStreetMap** (tegels) + **Leaflet** (kaartbibliotheek) + **Nominatim** (adres-zoekfunctie) | Geen account/sleutel nodig — publieke, gratis diensten. |

Er is **geen aparte backend-server**: alles draait via de Firebase
client-SDK rechtstreeks vanuit de browser (beveiligd via Firestore-/
Storage-rules, zie sectie 4), aangevuld met een handvol kleine
Next.js API-routes voor taken die niet in de browser kunnen (zie
sectie 3.3).

---

## 2. Technologie-stack

- **Framework**: [Next.js](https://nextjs.org) (**Pages Router**, niet de nieuwere App Router)
- **Taal**: JavaScript (geen TypeScript)
- **Styling**: inline `style`-objecten + `styled-jsx` (`<style jsx>`) voor
  zaken die inline niet kunnen (hover-states, media queries, keyframes).
  Geen los CSS-framework.
- **Kaarten**: [Leaflet](https://leafletjs.com) + [react-leaflet]-achtige
  eigen wrapper-componenten (`components/CampMap.js`,
  `components/LocationPicker.js`), dynamisch geïmporteerd (`next/dynamic`,
  `ssr: false`) omdat Leaflet enkel in de browser werkt.
- **Firebase SDK**: de client-SDK (`firebase/app`, `firebase/firestore`,
  `firebase/storage`, `firebase/auth`) — geen Admin SDK, dus geen
  server-side Firebase-code.

---

## 3. Opbouw van de code

### 3.1 Bestandsstructuur (belangrijkste mappen)

```
lib/
  firebase.js       Firebase-initialisatie (verwijst naar de named database)
  auth.js           Login/logout-helpers voor de beheerder
  dbSchema.js        ALLE Firestore/Storage-toegang, per collectie
                      gebundeld in een "Factory"-object (zie 3.2)
  theme.js           Design tokens: kleuren, fonts, radius
  utils.js            Losse hulpfuncties (zie 3.4)

components/          Herbruikbare UI-bouwstenen (zie 3.5)

pages/                Elke .js-file hier = één publieke of beheer-route
  api/                Next.js API-routes (server-side, zie 3.3)
  beheer/             Alles achter login (RequireAuth-component)
  entry/[id].js        Publiek profiel van één lid
  fotos/[id].js         Publiek detail van één foto
  ...                   (overige publieke pagina's, zie README.md §2)
```

### 3.2 Het "Factory"-patroon

Alle databasetoegang loopt via één bestand, `lib/dbSchema.js`. Per
Firestore-collectie is er één object (`EntryFactory`, `PhotoFactory`,
`LeidingFactory`, ...) met de bijhorende functies (`getAll`, `create`,
`update`, ...). Pagina's importeren enkel wat ze nodig hebben, bv.:

```js
import { EntryFactory, PhotoFactory } from '../lib/dbSchema';
```

Dit houdt alle Firestore-specifieke code (query's, veldnamen,
serverTimestamp-afhandeling) op één plek, los van de UI-componenten.

### 3.3 Server-routes (`pages/api/`)

Twee kleine API-routes voor taken die niet client-side kunnen:

- **`extract.js`** — stuurt een geüploade scan (base64) naar de
  Anthropic API en geeft gestructureerde JSON terug. Vereist
  `ANTHROPIC_API_KEY`.
- **`proxy-image.js`** — haalt een Firebase Storage-afbeelding
  server-side op en geeft ze terug met een CORS-vriendelijke header.
  Nodig om foto's te kunnen **draaien**: de browser mag de pixels van
  een cross-origin-afbeelding niet zomaar in een canvas inlezen, tenzij
  ze via een same-origin-route lopen. Enkel URL's van
  `firebasestorage.googleapis.com` worden doorgelaten (geen open proxy).

### 3.4 Belangrijke hulpfuncties (`lib/utils.js`)

- `parsePeriodRange`, `werkingsjaarLabel`, `huidigWerkingsjaarStart` —
  omgaan met scouting-werkingsjaren (september–augustus) en periodes.
- `groupByArrayField` — groepeert entries op een array-veld (gebruikt
  voor "beste kampplaats"-likes en gerechten-overzicht).
- `resizeImageFile` — verkleint een foto client-side (canvas) vóór het
  opladen.
- `rotateImageFile` — draait een foto 90° (echte pixel-rotatie via
  canvas, laadt de bron via `proxy-image.js` om CORS te vermijden).
- `berekenBeeldHash*`, `hammingAfstand` — een "dHash" (perceptuele
  vingerafdruk) per foto, gebruikt om dubbele/gelijkende foto's op te
  sporen zonder externe dienst.
- `berekenFotoSorteerJaar`, `decenniumLabel` — een sorteerbaar
  "jaartal" berekenen uit exact jaar of decennium+positie, voor de
  chronologische foto-weergave.

### 3.5 Belangrijke componenten (`components/`)

- `RequireAuth.js` — beschermt alles onder `/beheer`; toont de
  admin-navigatie zodra ingelogd.
- `AdminNav.js` / `AdminSubNav.js` — hoofdnavigatie en tabbladen binnen
  het beheer.
- `PublicNav.js` — de publieke header/navigatie. Toont op een breed
  scherm logo + volledige knoppenrij; op een smal scherm (≤ 680px, via
  CSS media query) een compacte balk met een uitklapmenu. Bevat ook het
  vaste ✉️-contact-icoontje (`ContactLink`).
- `MemberTagPicker.js` — zoek/tag-component voor personen, herbruikt bij
  foto's én leidingsploegen. Maakt bij een onbekende naam automatisch een
  minimale "stub"-fiche aan (zie §4.2) in plaats van de naam enkel als
  losse tekst te bewaren.
- `PhotoTagSelector.js` / `TagFilterPicker.js` — respectievelijk tags
  toekennen aan een foto, en filteren op tags (compacte, uitklapbare
  multi-select).
- `CampMap.js` / `LocationPicker.js` — Leaflet-kaartweergave met
  uitlichtbare pins, en een klikbare kaart om coördinaten te kiezen.

---

## 4. Firestore-databasestructuur

Firebase-project **Winkelsimpel**, named database
**`sinteduardusscouts4ever`** (gedeeld Firebase-project, maar een eigen,
volledig gescheiden database binnen dat project). Onderstaande
collecties bestaan; het exacte veldschema staat telkens in het
bijhorende Factory-object in `lib/dbSchema.js`.

| Collectie | Factory | Inhoud |
|---|---|---|
| `entries` | `EntryFactory` | Vriendenboekje-fiches. Status: `draft` (concept, wacht op goedkeuring) → `published`, of `stub` (enkel een naam, ontstaan via het taggen van iemand zonder fiche — zie §4.2) |
| `photos` | `PhotoFactory` | Foto's: `afbeeldingUrl`/`afbeeldingPath` (Storage), `jaar`/`decennium`/`decenniumPositie`, `locatie`, `beschrijving`, `ledenTags`/`taggedEntryIds`, `tagIds`, `beeldHash` (dubbel-detectie), `status` (`pending`/`published`), `verwijderVerzoek` |
| `photoTags` | `PhotoTagFactory` | Beheerder-beheerde lijst foto-categorieën |
| `locations` | `LocationFactory` | Coördinaten per (genormaliseerde) kampplaats-naam uit de vriendenboekjes — doc-ID = genormaliseerde naam |
| `extraLocations` | `ExtraLocationFactory` | Los toegevoegde/voorgestelde kampplaatsen, met `status` (`pending`/`published`) |
| `dishes` | `DishFactory` | Receptkoppeling per gerecht-naam |
| `links` | `LinkFactory` | Externe links-pagina |
| `badges` | `KentekenFactory` | Jaarkentekens (afbeelding + jaarleuze), doc-ID = werkingsjaar-startjaar |
| `milestones` | `MijlpaalFactory` | Mijlpalen op de tijdlijn, `type`: `scouting` (bewegingsbreed) of `groep`; `status` `pending`/`published` |
| `scoutTakken` | `TakFactory` | Beheerder-beheerde lijst takken (Kapoenen, Welpen, ...), met een `volgorde`-veld |
| `leidingsploegen` | `LeidingFactory` | Leidingsploeg per tak + werkingsjaar; doc-ID = `{takId}_{werkingsjaarStart}` |
| `statistieken` | `StatsFactory` | Bezoekersaantallen, geaggregeerd per (dag, pagina) — geen individuele bezoek-logs |
| `contactBerichten` | `ContactFactory` | Berichten via het contactformulier |
| `activiteiten` | `ActivityFactory` | Logboek van publieke (crowdsourced) wijzigingen, voor het beheerder-overzicht op `/beheer/activiteit` |

### 4.1 Firebase Storage

E�n gedeelde bucket met Winkelsimpel, met een eigen voorvoegsel:

```
vriendenboekje/
  scans/       Geüploade vriendenboekje-scans
  fotos/       Foto-uploads (crowdsourced + beheerder)
  kentekens/   Jaarkenteken-afbeeldingen
  mijlpalen/   Mijlpaal-afbeeldingen
```

### 4.2 Bijzonder concept: "stub"-fiches

Wanneer iemand een naam intypt bij het taggen (in een foto of
leidingsploeg) die nog niet bestaat, maakt `MemberTagPicker` automatisch
een minimale `entries`-fiche aan met `status: 'stub'` (enkel een naam,
verder alles leeg). Zo is die naam **herbruikbaar** bij een volgende tag
in plaats van telkens een nieuwe, losse naam te typen, en kan die persoon
nadien zelf (via *"Ben je misschien al ...?"* op `/toevoegen`) zijn eigen
volledige fiche invullen — waarbij de bestaande stub wordt **bijgewerkt**
(status → `draft`) in plaats van een dubbele fiche aan te maken. De
beheerder moet zo'n koppeling nog wel expliciet bevestigen
(`koppelingBevestigd`-veld) voor het gepubliceerd kan worden.

---

## 5. Beveiligingsmodel (Firestore- en Storage-rules)

De volledige, actuele regels staan in `firestore.rules` en
`storage.rules` — dit is de samenvatting van het principe erachter:

- **Publiek lezen**: enkel `status: 'published'` (of `'stub'` voor
  profielen) is voor iedereen leesbaar; `pending`/`draft` enkel voor de
  ingelogde beheerder.
- **Publiek crowdsourcen, bewust begrensd per collectie**:
  - *Nieuwe* inzendingen (foto's, kampplaatsen, mijlpalen, vriendenboekje-
    formulieren) mogen door iedereen aangemaakt worden, maar **altijd**
    met `status: 'pending'`/`'draft'` — nooit meteen zichtbaar zonder
    goedkeuring.
  - *Bewerken van bestaande, al gepubliceerde* foto's/leidingsploegen mag
    door iedereen, **zonder** goedkeuringsstap (bewuste keuze: anders is
    "help mee sorteren/taggen" niet haalbaar) — maar telkens met
    striktere veld-voor-veld-validatie (bv. mag `afbeeldingUrl` enkel
    wijzigen naar een pad binnen de eigen Storage-map, mag `contactEmail`
    nooit wijzigen).
  - *Verwijderen* van bestaande data is **altijd** beheerder-only.
- **Beheerder** (`request.auth != null`): volledige lees-/schrijftoegang
  op alles.
- **Activiteiten- en statistieken-logs**: publiek enkel *aanmaken*
  (met veldvalidatie, geen persoonsgegevens), enkel de beheerder mag
  lezen.

---

## 6. Omgevingsvariabelen (Vercel)

| Variabele | Waarvoor |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (API-key, project-ID, ...) | Firebase client-SDK-configuratie |
| `ANTHROPIC_API_KEY` | Tekstherkenning van scans (`pages/api/extract.js`) |

(Exacte namen: zie `lib/firebase.js` en `pages/api/extract.js`, of het
Vercel-dashboard → Settings → Environment Variables van dit project.)

---

## 7. Toekomstplannen (niet gebouwd)

Er is een uitgebreide analyse gemaakt voor een eventuele **multi-groep
versie** (andere scoutsgroepen die dezelfde toepassing zouden gebruiken,
met een systeembeheerder-rol, een overkoepelende-organisatie-laag,
onboarding, en een business-model). Dat is bewust **niet** geïmplementeerd
— de huidige toepassing blijft single-tenant (enkel Sint-Eduardusscouts).
Mocht dit ooit actueel worden, begin dan bij die eerdere analyse in
plaats van dit vanaf nul te herdenken.

## 8. Kleine nabranders (na de eerste lancering)

- **Dashboard-links filteren meteen door**: `/beheer/vriendenboek`
  ondersteunt de query-parameters `?status=` (`draft`/`published`/`stub`)
  en `?kampplaats=niet-gekoppeld`, zodat een link vanaf het dashboard
  meteen het juiste filter toont in plaats van enkel het algemene
  overzicht.
- **Activiteitenlog linkt door naar leidingsploegen**: `/tijdlijn`
  ondersteunt `?leidingTak={takId}&leidingJaar={jaar}` om een specifieke
  leidingsploeg automatisch te openen en ernaartoe te scrollen — gebruikt
  door `/beheer/activiteit` se "bekijken →"-link bij dat type activiteit.
- **Kampplaatsen "geen koppeling nodig"**: `LocationFactory.markeerGenegeerd(naam)`
  maakt een locatie-document aan met `lat`/`lng: null` en `genegeerd: true`
  — voor namen die geen echte plaats zijn (bv. "Allemaal"). Omdat de
  bestaande "is dit gekoppeld?"-tellingen overal enkel controleren of er
  *een* document bestaat voor die naam (niet of er coördinaten zijn),
  tellen genegeerde plaatsen automatisch niet meer mee als "nog te
  koppelen" — zonder dat die tellingen zelf moesten aangepast worden.

## 9. Goedkeuringsflow vriendenboekje-formulieren (gewijzigd)

Het publieke `/toevoegen`-formulier (geen scan/OCR) publiceert een nieuwe
fiche voortaan **meteen** (`status: 'published'`), maar met een nieuw
veld **`goedgekeurd: false`** tot de beheerder het nakeek. Zolang dat zo
is, toont de publieke fiche (en de kaart op `/vriendenboekje`) een
"⏳ Wacht op goedkeuring"-label. In het beheer heet de filter/telling
hiervoor **"Goed te keuren"** (i.p.v. het vroegere "Concepten") en omvat
nu twee gevallen samen:
- `status: 'draft'` — een door de beheerder opgeladen scan, nog niet
  gepubliceerd (deze flow bleef **ongewijzigd**: hier is bewust nog een
  nakijkstap nodig vóór het publiek zichtbaar wordt, want de automatische
  tekstherkenning kan fouten bevatten).
- `status: 'published'`, `goedgekeurd: false` — een publiek ingediend
  formulier, al zichtbaar, wacht enkel nog op een bevestiging.

`EntryFactory.keurGoed(id)` zet enkel `goedgekeurd: true` (geen
statuswijziging, want de fiche was al gepubliceerd). Bestaande fiches
zonder het veld `goedgekeurd` worden overal als "goedgekeurd" behandeld
(`entry.goedgekeurd === false` faalt voor `undefined`) — geen
migratiescript nodig.

De "ben je misschien X?"-koppeling (stub → volledige fiche) volgt
bewust een **strengere** flow en bleef ongewijzigd: die blijft volledig
verborgen (`status: 'draft'`) tot de beheerder de koppeling expliciet
bevestigt via `koppelingBevestigd`, omdat een foute koppeling daar
iemands foto-/leidingsploeg-geschiedenis aan de verkeerde naam zou
hangen.
