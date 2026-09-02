import { initializeApp, getApps, FirebaseApp, deleteApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  User, 
  onAuthStateChanged,
  Auth
} from "firebase/auth";

export const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export const getSavedFirebaseConfig = () => {
  const custom = localStorage.getItem("gemini_food_journal_fb_config");
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch {}
  }
  return defaultFirebaseConfig;
};

let app: FirebaseApp | undefined;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();

export const initFirebaseAsync = async (): Promise<Auth | null> => {
  if (auth && app && app.options.apiKey && app.options.apiKey !== "DEMO_KEY_LOCAL_FALLBACK") {
    return auth;
  }
  try {
    const res = await fetch("/api/config/firebase");
    if (res.ok) {
      const remoteConfig = await res.json();
      if (remoteConfig.apiKey) {
        if (getApps().length > 0) {
          const existing = getApps()[0];
          if (existing.options.apiKey !== remoteConfig.apiKey) {
            await deleteApp(existing);
            app = initializeApp(remoteConfig);
          } else {
            app = existing;
          }
        } else {
          app = initializeApp(remoteConfig);
        }
        auth = getAuth(app);
        return auth;
      }
    }
  } catch (err) {
    console.warn("Could not fetch remote Firebase config:", err);
  }

  if (!app) {
    const config = getSavedFirebaseConfig();
    app = getApps().length > 0 ? getApps()[0] : initializeApp({
      apiKey: config.apiKey || "DEMO_KEY_LOCAL_FALLBACK",
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId || "demo-app-id"
    });
    auth = getAuth(app);
  }
  return auth;
};

try {
  const config = getSavedFirebaseConfig();
  if (config.apiKey) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
    auth = getAuth(app);
  }
} catch (err) {
  console.warn("Firebase client initial setup:", err);
}

export { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged 
};
export type { User };
