import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { GoogleAuthProvider, browserLocalPersistence, getAuth, initializeAuth, setPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = Constants.expoConfig?.extra?.firebase ?? {
  apiKey: 'AIzaSyDwm6aQ-I--4O2qJq3DrWPMaXlHH7P8k4A',
  authDomain: 'caele-app.firebaseapp.com',
  projectId: 'caele-app',
  storageBucket: 'caele-app.firebasestorage.app',
  messagingSenderId: '54754152307',
  appId: '1:54754152307:web:f679ed5fb2932430caff06',
  measurementId: 'G-R1E9BXXWF1',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const storage = getStorage(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

// IMPORTANTE: obtener getReactNativePersistence solo en nativo
const getReactNativePersistence =
  Platform.OS === 'web'
    ? undefined
    : // @ts-ignore – require dinámico para evitar incluirlo en web
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('firebase/auth').getReactNativePersistence;

let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} else {
  // Evita reinicializar Auth en hot-reload
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence!(AsyncStorage) });
  } catch {
    auth = getAuth(app);
  }
}

const googleProvider = new GoogleAuthProvider();

export { app, auth, database, firestore, googleProvider, storage };

