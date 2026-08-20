import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';

// ---- Collections ----
const ENTRIES = 'entries';

// Folder-prefix binnen de gedeelde Winkelsimpel Storage-bucket, zodat
// vriendenboekje-scans nooit door elkaar lopen met Winkelsimpel-bestanden.
const STORAGE_PREFIX = 'vriendenboekje';

// ---- EntryFactory: alle Firestore-toegang voor vriendenboekje-entries ----
export const EntryFactory = {
  /**
   * Maak een nieuwe entry aan (start altijd als concept).
   */
  async create(data) {
    const docRef = await addDoc(collection(db, ENTRIES), {
      naam: data.naam || '',
      geboortejaar: data.geboortejaar || '',
      totemnaam: data.totemnaam || '',
      periode: data.periode || '',
      leuksteActiviteit: data.leuksteActiviteit || [],
      besteKampplaats: data.besteKampplaats || [],
      lekkersteEten: data.lekkersteEten || [],
      scanUrl: data.scanUrl || null,
      scanPath: data.scanPath || null,
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id, data) {
    await updateDoc(doc(db, ENTRIES, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async publish(id) {
    await updateDoc(doc(db, ENTRIES, id), {
      status: 'published',
      updatedAt: serverTimestamp(),
    });
  },

  async unpublish(id) {
    await updateDoc(doc(db, ENTRIES, id), {
      status: 'draft',
      updatedAt: serverTimestamp(),
    });
  },

  async remove(id, scanPath) {
    if (scanPath) {
      try {
        await deleteObject(ref(storage, scanPath));
      } catch (e) {
        // scan al weg of nooit bestaan, geen probleem
      }
    }
    await deleteDoc(doc(db, ENTRIES, id));
  },

  async getById(id) {
    const snap = await getDoc(doc(db, ENTRIES, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  async getAll() {
    const q = query(collection(db, ENTRIES), orderBy('naam', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getPublished() {
    const q = query(
      collection(db, ENTRIES),
      where('status', '==', 'published'),
      orderBy('naam', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};

// ---- ScanStorageFactory: alle Storage-toegang voor scans ----
export const ScanStorageFactory = {
  /**
   * Upload een scan (afbeelding of pdf) en geef url + storage path terug.
   */
  async upload(file, entryId) {
    const path = `${STORAGE_PREFIX}/scans/${entryId}-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, path };
  },
};

// ---- LocationFactory: coördinaten per kampplaats-naam ----
// Losse collectie zodat kampplaats-namen (vrije tekst, bv. "Falmignoul (Walzin)")
// eenmalig gekoppeld kunnen worden aan een lat/lng, herbruikbaar over entries heen.
const LOCATIONS = 'locations';

function normalizeLocationName(naam) {
  return naam.trim().toLowerCase();
}

export const LocationFactory = {
  async getAll() {
    const snap = await getDocs(collection(db, LOCATIONS));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  /**
   * Sla coördinaten op voor een kampplaats-naam. Het genormaliseerde adres
   * dient als document-ID zodat dezelfde plaats altijd hetzelfde document raakt.
   */
  async set(naam, lat, lng) {
    const id = normalizeLocationName(naam);
    await setDoc(doc(db, LOCATIONS, id), {
      naam,
      lat,
      lng,
      updatedAt: serverTimestamp(),
    });
  },

  async remove(naam) {
    const id = normalizeLocationName(naam);
    await deleteDoc(doc(db, LOCATIONS, id));
  },
};

// ---- ExtraLocationFactory: los toegevoegde kampplaatsen ----
// Dit zijn GEEN "beste kampplaats"-stemmen uit de vriendenboekje-formulieren
// (die blijven via LocationFactory + groupByArrayField op besteKampplaats
// lopen, en gelden als "likes"). Dit zijn bijkomende, door de beheerder of
// door bezoekers voorgestelde plekken, los van een specifieke entry.
const EXTRA_LOCATIONS = 'extraLocations';

export const ExtraLocationFactory = {
  async getAllAdmin() {
    const snap = await getDocs(collection(db, EXTRA_LOCATIONS));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  },

  async getPublished() {
    const q = query(collection(db, EXTRA_LOCATIONS), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  /** Beheerder voegt meteen gepubliceerd toe; coördinaten optioneel. */
  async createByAdmin({ naam, beschrijving, lat, lng }) {
    const docRef = await addDoc(collection(db, EXTRA_LOCATIONS), {
      naam: naam || '',
      beschrijving: beschrijving || '',
      lat: lat ?? null,
      lng: lng ?? null,
      contactEmail: null,
      status: 'published',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** Publieke inzending — geen login, altijd 'pending'. Coördinaten mogen
   *  wel meegestuurd worden, als de bezoeker zelf een plek koos op de kaart. */
  async createPublic({ naam, beschrijving, lat, lng, contactEmail }) {
    const docRef = await addDoc(collection(db, EXTRA_LOCATIONS), {
      naam: naam || '',
      beschrijving: beschrijving || '',
      lat: lat ?? null,
      lng: lng ?? null,
      contactEmail: contactEmail || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id, { naam, beschrijving, lat, lng }) {
    await updateDoc(doc(db, EXTRA_LOCATIONS, id), {
      naam,
      beschrijving,
      lat: lat ?? null,
      lng: lng ?? null,
    });
  },

  async approve(id) {
    await updateDoc(doc(db, EXTRA_LOCATIONS, id), { status: 'published' });
  },

  async remove(id) {
    await deleteDoc(doc(db, EXTRA_LOCATIONS, id));
  },
};

// ---- DishFactory: receptkoppelingen per gerecht-naam ----
// Zelfde patroon als LocationFactory: een gerecht-naam (vrije tekst,
// genormaliseerd als document-ID) kan gekoppeld worden aan een recept-url
// of -notitie, herbruikbaar over entries heen.
const DISHES = 'dishes';

function normalizeDishName(naam) {
  return naam.trim().toLowerCase();
}

export const DishFactory = {
  async getAll() {
    const snap = await getDocs(collection(db, DISHES));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async set(naam, { receptUrl = '', receptNotitie = '' }) {
    const id = normalizeDishName(naam);
    await setDoc(
      doc(db, DISHES, id),
      { naam, receptUrl, receptNotitie, updatedAt: serverTimestamp() },
      { merge: true }
    );
  },

  async remove(naam) {
    const id = normalizeDishName(naam);
    await deleteDoc(doc(db, DISHES, id));
  },
};

// ---- LinkFactory: losse links-pagina (bv. verwijzingen naar andere sites) ----
const LINKS = 'links';

export const LinkFactory = {
  async getAll() {
    const q = query(collection(db, LINKS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async create({ naam, url, omschrijving }) {
    const docRef = await addDoc(collection(db, LINKS), {
      naam: naam || '',
      url: url || '',
      omschrijving: omschrijving || '',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id, { naam, url, omschrijving }) {
    await updateDoc(doc(db, LINKS, id), { naam, url, omschrijving });
  },

  async remove(id) {
    await deleteDoc(doc(db, LINKS, id));
  },
};

// ---- Generieke afbeelding-upload binnen de vriendenboekje-prefix ----
async function uploadAfbeelding(file, submap, naam) {
  const path = `${STORAGE_PREFIX}/${submap}/${naam}-${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

async function verwijderAfbeelding(path) {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (e) {
    // al weg of nooit bestaan, geen probleem
  }
}

// ---- KentekenFactory: jaarkentekens + jaarleuze per werkingsjaar ----
// Eén document per werkingsjaar (startjaar als ID, bv. "1944" voor het
// werkingsjaar 1944–1945).
const KENTEKENS = 'badges';

export const KentekenFactory = {
  async getAll() {
    const snap = await getDocs(collection(db, KENTEKENS));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.startJaar - b.startJaar);
  },

  /**
   * Slaat een jaarkenteken op. `file` is optioneel (enkel meesturen als er
   * een nieuwe afbeelding gekozen is); `bestaandePath` is de vorige
   * afbeelding-path, die dan eerst verwijderd wordt.
   */
  async set(startJaar, { jaarleuze, file, bestaandePath }) {
    const data = {
      startJaar,
      jaarleuze: jaarleuze || '',
      updatedAt: serverTimestamp(),
    };
    if (file) {
      if (bestaandePath) await verwijderAfbeelding(bestaandePath);
      const upload = await uploadAfbeelding(file, 'kentekens', String(startJaar));
      data.afbeeldingUrl = upload.url;
      data.afbeeldingPath = upload.path;
    }
    await setDoc(doc(db, KENTEKENS, String(startJaar)), data, { merge: true });
  },

  async remove(startJaar, afbeeldingPath) {
    await verwijderAfbeelding(afbeeldingPath);
    await deleteDoc(doc(db, KENTEKENS, String(startJaar)));
  },
};

// ---- MijlpaalFactory: belangrijke mijlpalen op de tijdlijn ----
// Beheerder-toegevoegde mijlpalen zijn meteen gepubliceerd; publieke
// inzendingen (via /mijlpaal-toevoegen) starten als 'pending' en moeten
// eerst goedgekeurd worden.
const MIJLPALEN = 'milestones';

export const MijlpaalFactory = {
  async getAllAdmin() {
    const snap = await getDocs(collection(db, MIJLPALEN));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.jaar - b.jaar);
  },

  async getPublished() {
    const q = query(collection(db, MIJLPALEN), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.jaar - b.jaar);
  },

  async createByAdmin({ jaar, titel, beschrijving, type, file }) {
    const docRef = await addDoc(collection(db, MIJLPALEN), {
      jaar,
      titel: titel || '',
      beschrijving: beschrijving || '',
      type: type === 'scouting' ? 'scouting' : 'groep',
      afbeeldingUrl: null,
      afbeeldingPath: null,
      contactEmail: null,
      status: 'published',
      createdAt: serverTimestamp(),
    });
    if (file) {
      const upload = await uploadAfbeelding(file, 'mijlpalen', docRef.id);
      await updateDoc(doc(db, MIJLPALEN, docRef.id), {
        afbeeldingUrl: upload.url,
        afbeeldingPath: upload.path,
      });
    }
    return docRef.id;
  },

  /** Publieke inzending — geen login, geen afbeelding, altijd 'pending'. */
  async createPublic({ jaar, titel, beschrijving, type, contactEmail }) {
    const docRef = await addDoc(collection(db, MIJLPALEN), {
      jaar,
      titel: titel || '',
      beschrijving: beschrijving || '',
      type: type === 'scouting' ? 'scouting' : 'groep',
      afbeeldingUrl: null,
      afbeeldingPath: null,
      contactEmail: contactEmail || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id, { jaar, titel, beschrijving, type, file, bestaandePath }) {
    const data = { jaar, titel, beschrijving, type: type === 'scouting' ? 'scouting' : 'groep' };
    if (file) {
      if (bestaandePath) await verwijderAfbeelding(bestaandePath);
      const upload = await uploadAfbeelding(file, 'mijlpalen', id);
      data.afbeeldingUrl = upload.url;
      data.afbeeldingPath = upload.path;
    }
    await updateDoc(doc(db, MIJLPALEN, id), data);
  },

  async approve(id) {
    await updateDoc(doc(db, MIJLPALEN, id), { status: 'published' });
  },

  async remove(id, afbeeldingPath) {
    await verwijderAfbeelding(afbeeldingPath);
    await deleteDoc(doc(db, MIJLPALEN, id));
  },
};

// ---- PhotoFactory: losse foto-links (extern gehost, bv. OneDrive/Google Drive) ----
// Elke foto is een los document met eigen, optionele tags (jaar, locatie,
// getagde leden). Nieuwe foto's (admin of publiek) starten als 'pending' en
// moeten goedgekeurd worden. Tags op een reeds gepubliceerde foto mogen
// bezoekers WEL rechtstreeks aanpassen (crowdsourced sorteren) — dat is
// bewust een lichtere regel dan bij nieuwe inzendingen, zie firestore.rules.
// Een verwijderverzoek is enkel een vlag; effectief verwijderen doet de
// beheerder.
const PHOTOS = 'photos';

export const PhotoFactory = {
  async getAllAdmin() {
    const snap = await getDocs(collection(db, PHOTOS));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  },

  async getPublished() {
    const q = query(collection(db, PHOTOS), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getById(id) {
    const snap = await getDoc(doc(db, PHOTOS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  /**
   * Laadt een lijst (al verkleinde) bestanden op naar Storage en maakt voor
   * elk een Firestore-document aan. `voortgang(index, status)` is optioneel
   * en wordt na elk bestand aangeroepen ('bezig' | 'klaar' | 'fout').
   */
  async _uploadBestanden(files, extraVelden, voortgang) {
    let gelukt = 0;
    await Promise.all(
      files.map(async (file, i) => {
        try {
          voortgang?.(i, 'bezig');
          const upload = await uploadAfbeelding(file, 'fotos', `foto-${i}`);
          await addDoc(collection(db, PHOTOS), {
            afbeeldingUrl: upload.url,
            afbeeldingPath: upload.path,
            jaar: null,
            locatie: '',
            beschrijving: '',
            ledenTags: [],
            taggedEntryIds: [],
            tagIds: [],
            contactEmail: null,
            status: 'published',
            verwijderVerzoek: false,
            verwijderReden: '',
            createdAt: serverTimestamp(),
            ...extraVelden,
          });
          gelukt += 1;
          voortgang?.(i, 'klaar');
        } catch (err) {
          voortgang?.(i, 'fout');
        }
      })
    );
    return gelukt;
  },

  /** Beheerder voegt in bulk toe (al verkleinde bestanden), meteen gepubliceerd. */
  async createBulkByAdmin(files, { jaar, locatie }, voortgang) {
    return this._uploadBestanden(
      files,
      { jaar: jaar ?? null, locatie: locatie || '', status: 'published', contactEmail: null },
      voortgang
    );
  },

  /** Publieke inzending -- geen login, altijd 'pending'. Ook in bulk mogelijk. */
  async createBulkPublic(files, { contactEmail }, voortgang) {
    return this._uploadBestanden(
      files,
      { status: 'pending', contactEmail: contactEmail || '' },
      voortgang
    );
  },

  /** Publiek en beheerder: tags aanpassen op een bestaande, gepubliceerde foto. */
  async updateTags(id, { jaar, locatie, beschrijving, ledenTags, tagIds }) {
    const lijst = ledenTags || [];
    await updateDoc(doc(db, PHOTOS, id), {
      jaar: jaar ?? null,
      locatie: locatie || '',
      beschrijving: beschrijving || '',
      ledenTags: lijst,
      tagIds: tagIds || [],
      // Losse, makkelijk doorzoekbare lijst van entry-ID's (zonder de vrij
      // getypte namen zonder koppeling), zodat een profielpagina simpel kan
      // filteren op "foto's waarin deze persoon getagd is".
      taggedEntryIds: lijst.map((t) => t.entryId).filter(Boolean),
    });
  },

  /** Publiek en beheerder: de afbeelding vervangen (bv. na het draaien). */
  async replaceImage(id, file, oudePad) {
    const upload = await uploadAfbeelding(file, 'fotos', 'foto-gedraaid');
    await updateDoc(doc(db, PHOTOS, id), {
      afbeeldingUrl: upload.url,
      afbeeldingPath: upload.path,
    });
    if (oudePad) await verwijderAfbeelding(oudePad);
    return upload;
  },

  /** Publiek gepubliceerde foto's waarop een bepaald lid getagd is. */
  async getByEntryId(entryId) {
    const alle = await this.getPublished();
    return alle.filter((f) => (f.taggedEntryIds || []).includes(entryId));
  },

  /** Publiek: vraag om verwijdering markeren (verwijdert niet effectief). */
  async requestDelete(id, reden) {
    await updateDoc(doc(db, PHOTOS, id), {
      verwijderVerzoek: true,
      verwijderReden: reden || '',
    });
  },

  async cancelDeleteRequest(id) {
    await updateDoc(doc(db, PHOTOS, id), { verwijderVerzoek: false, verwijderReden: '' });
  },

  async approve(id) {
    await updateDoc(doc(db, PHOTOS, id), { status: 'published' });
  },

  async remove(id, afbeeldingPath) {
    await verwijderAfbeelding(afbeeldingPath);
    await deleteDoc(doc(db, PHOTOS, id));
  },
};

// ---- PhotoTagFactory: door de beheerder beheerde foto-categorieen ----
// Bewust apart van de vrij-getypte ledenTags: enkel de beheerder maakt
// nieuwe tags aan, om een wildgroei aan bijna-identieke categorieen te
// vermijden. Toekennen van een bestaande tag aan een foto mag wel door
// iedereen (zie PhotoFactory.updateTags), net als de andere foto-tags.
const PHOTO_TAGS = 'photoTags';

export const PhotoTagFactory = {
  async getAll() {
    const snap = await getDocs(collection(db, PHOTO_TAGS));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.naam.localeCompare(b.naam));
  },

  async create(naam) {
    const docRef = await addDoc(collection(db, PHOTO_TAGS), {
      naam: naam.trim(),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id, naam) {
    await updateDoc(doc(db, PHOTO_TAGS, id), { naam: naam.trim() });
  },

  async remove(id) {
    await deleteDoc(doc(db, PHOTO_TAGS, id));
  },
};
