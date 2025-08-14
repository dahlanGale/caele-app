import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDwm6aQ-I--4O2qJq3DrWPMaXlHH7P8k4A",
  authDomain: "caele-app.firebaseapp.com",
  projectId: "caele-app",
  storageBucket: "caele-app.firebasestorage.app",
  messagingSenderId: "54754152307",
  appId: "1:54754152307:web:f679ed5fb2932430caff06",
  measurementId: "G-R1E9BXXWF1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const storage = getStorage(app);
const firestore = getFirestore(app);
const database = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, database, firestore, googleProvider, storage };

