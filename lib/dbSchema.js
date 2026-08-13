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
      leuksteActiviteit: data.leuksteActiviteit || '',
      besteKampplaats: data.besteKampplaats || '',
      lekkersteEten: data.lekkersteEten || '',
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
