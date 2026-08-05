import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Aparte, named Firestore-database binnen het bestaande Winkelsimpel-project —
// volledig los van Winkelsimpel's eigen (default) database.
export const db = getFirestore(app, 'sinteduardusscouts4ever');

// Storage: dezelfde bucket als Winkelsimpel, gescheiden via een folder-prefix
// (zie STORAGE_PREFIX in dbSchema.js).
export const storage = getStorage(app);
