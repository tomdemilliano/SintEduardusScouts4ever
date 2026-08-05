import {
  collection,
  doc,
  addDoc,
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
