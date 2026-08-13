// Haalt het eerste herkenbare jaartal (19xx of 20xx) uit een vrije-tekst
// periode-veld zoals "1952 - 1955" of "ongeveer 1978".
export function parseStartYear(periode) {
  if (!periode) return null;
  const match = periode.match(/(19|20)\d{2}/);
  return match ? parseInt(match[0], 10) : null;
}

const STOPWOORDEN = new Set([
  'de', 'het', 'een', 'en', 'van', 'met', 'op', 'in', 'te', 'was', 'voor',
  'aan', 'die', 'dat', 'we', 'wij', 'ons', 'onze', 'ik', 'mijn', 'als',
  'ook', 'nog', 'maar', 'of', 'is', 'zijn', 'er', 'bij', 'naar', 'dan',
  'zo', 'wel', 'niet', 'geen', 'this', 'the', 'a', 'and',
]);

/**
 * Splitst een lijst vrije-tekst-fragmenten op in losse woorden, telt de
 * frequentie en filtert stopwoorden/korte woorden — voor de woordenwolk.
 */
export function wordFrequencies(teksten, minLength = 3) {
  const counts = {};
  teksten
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[.,!?;:()"'’]/g, ' ')
    .split(/\s+/)
    .forEach((woord) => {
      if (woord.length < minLength) return;
      if (STOPWOORDEN.has(woord)) return;
      counts[woord] = (counts[woord] || 0) + 1;
    });
  return Object.entries(counts)
    .map(([tekst, aantal]) => ({ tekst, aantal }))
    .sort((a, b) => b.aantal - a.aantal);
}

/**
 * Groepeert entries op een veld dat een lijst van waarden bevat (bv. meerdere
 * gerechten per entry). Blijft ook werken met oudere entries waar het veld
 * nog een losse string was in plaats van een array.
 */
export function groupByArrayField(entries, key) {
  const groups = {};
  entries.forEach((entry) => {
    const raw = entry[key];
    if (!raw) return;
    const lijst = Array.isArray(raw) ? raw : [raw];
    lijst.forEach((item) => {
      const trimmed = (item || '').trim();
      if (!trimmed) return;
      const norm = trimmed.toLowerCase();
      if (!groups[norm]) {
        groups[norm] = { label: trimmed, entries: [] };
      }
      groups[norm].entries.push(entry);
    });
  });
  return Object.values(groups).sort((a, b) => b.entries.length - a.entries.length);
}

/**
 * Normaliseert een lekkersteEten-veld naar een array, ongeacht of het een
 * oudere losse string is of al een array.
 */
export function toDishArray(value) {
  if (Array.isArray(value)) return value.length ? value : [''];
  if (typeof value === 'string' && value.trim()) return [value];
  return [''];
}

/**
 * Leest een bestand in als base64 (zonder de data-url prefix), voor gebruik
 * in de Claude-vision herkenning.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = () => reject(new Error('Bestand lezen mislukt'));
    r.readAsDataURL(file);
  });
}

/**
 * Groepeert een lijst entries op een genormaliseerde versie van een veld
 * (voor "leukste spellen" / "kampplaatsen"-overzichten): zelfde tekst,
 * andere hoofdletters/spaties -> dezelfde groep.
 */
export function groupByField(entries, key) {
  const groups = {};
  entries.forEach((entry) => {
    const raw = (entry[key] || '').trim();
    if (!raw) return;
    const norm = raw.toLowerCase();
    if (!groups[norm]) {
      groups[norm] = { label: raw, entries: [] };
    }
    groups[norm].entries.push(entry);
  });
  return Object.values(groups).sort((a, b) => b.entries.length - a.entries.length);
}
