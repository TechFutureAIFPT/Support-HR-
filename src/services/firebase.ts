import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getToken, initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
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
export const app = initializeApp(firebaseConfig);

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim();
let appCheckInstance: AppCheck | null = null;

if (typeof window !== 'undefined' && appCheckSiteKey) {
  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('Firebase App Check initialization skipped:', error);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function getFirebaseAppCheckToken(): Promise<string | null> {
  if (!appCheckInstance) return null;
  try {
    const result = await getToken(appCheckInstance, false);
    return result.token || null;
  } catch (error) {
    console.warn('Failed to obtain Firebase App Check token:', error);
    return null;
  }
}
