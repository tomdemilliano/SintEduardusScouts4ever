# Vrienden van Sint-Eduardusscouts — Vriendenboekje

Een website voor oud-leden van Sint-Eduardusscouts: een digitaal
vriendenboekje, een fotoarchief en een tijdlijn van de groep, samen
opgebouwd door de oud-leden zelf. Live op **[onsstamboek.be](https://onsstamboek.be)**.

Dit document beschrijft **wat de site doet en hoe je ze gebruikt** — als
bezoeker en als beheerder. Voor de technische opbouw (Firebase, Vercel,
databasestructuur, ...), zie **[TECHNISCH.md](./TECHNISCH.md)**.

---

## 1. Waarom deze site bestaat

Op de reünie van Sint-Eduardusscouts vulden veel oud-leden een
formuliertje in met hun beste herinneringen. Die verhalen — en alles wat
er sindsdien bijkwam — staan hier gebundeld, met één belangrijk
uitgangspunt: **de site vult zichzelf grotendeels aan door de bezoekers
zelf** ("crowdsourcing"). Je hoeft niet in te loggen om foto's te taggen,
een kampplaats voor te stellen of een leidingsploeg aan te vullen.

---

## 2. Wat een bezoeker allemaal kan doen

### 📖 Het vriendenboekje
- Blader door alle oud-leden, zoek op naam of totemnaam.
- Elk profiel toont totemnaam, periode, leukste activiteiten, beste
  kampplaatsen, lekkerste eten — en de foto's waarin die persoon getagd
  staat.
- **Sta je er zelf nog niet tussen?** Vul via *"Was jij lid?"* je eigen
  fiche in. Werd je al ergens getagd op een foto zonder dat je een fiche
  had? Dan herkent het formulier dat ("Ben je misschien al ...?") en
  koppelt het je antwoord aan die bestaande, "kale" fiche in plaats van
  een dubbele aan te maken.
- Een apart tabblad **"Getagd, geen eigen fiche"** toont wie al herkend
  is op foto's of in een leidingsploeg, maar nog geen volledig
  vriendenboekje-formulier invulde.
- Vorige/volgende-knoppen met naam laten je vlot door de leden bladeren.

### 📷 Foto's
- Blader door alle foto's, gegroepeerd per decennium met een duidelijke
  scheidingslijn — plus een aparte groep **"Nog te dateren"** voor foto's
  zonder jaartal.
- Filter op jaar, locatie, tag-categorie (zichtbaar als kolom naast de
  lijst, of als knop op mobiel) of naam, en spring snel naar een
  decennium via de knoppenrij bovenaan.
- **Draag zelf foto's aan** (met automatische verkleining vóór het
  opladen) via *"Heb je zelf foto's?"*.
- **Klik een foto open** voor een volledig-scherm-weergave met
  locatie/jaartal/getagde-personen-icoontjes en pijlnavigatie.
- **Vul zelf aan**: jaar, decennium, locatie, categorie, wie erop staat —
  allemaal rechtstreeks bewerkbaar (achter een "Bewerken"-knop, om
  onbedoelde wijzigingen te vermijden). Je kan een foto ook laten
  **draaien** als de oriëntatie fout staat.
- **Sorteer mee op decennium**: bij `/fotos/sorteren` kan je foto's zonder
  jaartal met een simpele tik toewijzen aan een decennium, en binnen dat
  decennium verfijnen (vroeger/later).
- Twijfel je of een foto hier wel thuishoort? Vraag verwijdering aan —
  de beheerder bevestigt dat.

### ⏳ Tijdlijn
- Eén horizontaal overzicht van alle leden (met hun periode), de
  jaarkentekens, bewegingsbrede en groep-specifieke mijlpalen, en de
  leidingsploegen per tak — met een custom jaren-slider en een
  verticale jaarlijn.
- **Vul een leidingsploeg aan**: kies een tak en werkingsjaar, en typ of
  zoek de namen van de leiding. Ook dit is crowdsourced.
- Stel zelf een **mijlpaal** voor (bewegingsbreed of specifiek voor onze
  groep).

### 🏕️ Kampplaatsen
- Alle "beste kampplaatsen" uit de vriendenboekjes, plus los toegevoegde
  plekken, als compacte tegels met een kaart. Hover over het ❤️-icoontje
  om te zien wie de plek koos.
- Klik een naam aan om de bijhorende pin op de kaart uit te lichten.
- **Stel zelf een kampplaats voor**, met een kaart om de locatie meteen
  aan te duiden.

### 🍲 Eten & 🎲 Spellen & 🔗 Links
Overzichten van de lekkerste gerechten, tofste activiteiten en nuttige
externe links, opgebouwd uit wat leden invulden.

### Overal
- Een vast ✉️-icoontje rechtsboven om de websitebeheerder te
  contacteren.
- Alle publieke formulieren zijn beveiligd met een eenvoudige rekensom +
  een onzichtbare val voor bots — geen account nodig.

---

## 3. Wat de beheerder kan doen

Log in via `/beheer/login`. Het dashboard (`/beheer`) toont meteen een
**"Te behandelen"**-lijst (nieuwe inzendingen, verwijderverzoeken,
contactberichten, ...) en algemene statistieken.

| Onderdeel | Wat je er doet |
|---|---|
| **Vriendenboek** | Scans opladen (met automatische tekstherkenning), concepten nakijken en publiceren, niet-gepubliceerde/stub-fiches beheren |
| **Tijdlijn** | Mijlpalen goedkeuren, jaarkentekens toevoegen, takken beheren, leidingsploegen invullen/nakijken |
| **Kampplaatsen** | Kampplaatsen aan de kaart koppelen, voorgestelde plekken goedkeuren |
| **Foto's** | Nieuwe foto's in bulk opladen, tags beheren, **dubbels opsporen** (visuele gelijkenis, niet enkel identieke bestanden), op decennium sorteren |
| **Statistieken** | Bezoekersaantallen per dag/pagina |
| **Activiteit** | Wat bezoekers zelf via crowdsourcing wijzigden (foto's taggen, leiding invullen, ...) — met tellingen per dag/week/maand |
| **Contact** | Binnengekomen berichten via het contactformulier |

Een volledig overzicht van elk scherm vind je in de kop van elk
beheer-onderdeel zelf; de opbouw errond (rollen, databasestructuur,
beveiliging) staat in **[TECHNISCH.md](./TECHNISCH.md)**.

---

## 4. Ontstaan & plannen

Deze site groeide stap voor stap van een eenvoudig "vriendenboekje" naar
een volwaardig, crowdsourced archief. Er is ook nagedacht over een
**multi-groep versie** (zodat andere scoutsgroepen dit zelf zouden
kunnen gebruiken) — dat is voorlopig bewust **niet** gebouwd, in
afwachting van concrete interesse. Zie de losse analyse-documenten
(indien bewaard) voor dat plan, mocht dat ooit actueel worden.
