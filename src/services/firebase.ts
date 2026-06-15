import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
const firebaseConfig = {
  apiKey: "AIzaSyCddND9ciUpeL3xTpWTUMyQ0TG9FyUCdiU",
  authDomain: "gen-lang-client-0595612537.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0595612537-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0595612537",
  storageBucket: "gen-lang-client-0595612537.firebasestorage.app",
  messagingSenderId: "1022447215307",
  appId: "1:1022447215307:web:5fbf39694b90d420d2314e",
  measurementId: "G-9YGZ8Z594C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim();

if (typeof window !== 'undefined' && appCheckSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('Firebase App Check initialization skipped:', error);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
