import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth as initialAuth, 
  initFirebaseAsync,
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User
} from "../firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: (demoName?: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeAuth, setActiveAuth] = useState(initialAuth);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuth = async () => {
      // 1. Check if user was logged in via Demo Mode
      const savedDemoUser = localStorage.getItem("food_journal_demo_user");
      if (savedDemoUser) {
        try {
          const parsed = JSON.parse(savedDemoUser);
          setUser(parsed);
          setToken(`demo-token-${parsed.uid}`);
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem("food_journal_demo_user");
        }
      }

      // 2. Fetch runtime config if needed and attach listener
      const currentAuth = await initFirebaseAsync();
      if (currentAuth) {
        setActiveAuth(currentAuth);
        unsubscribe = onAuthStateChanged(currentAuth, async (fbUser: User | null) => {
          if (fbUser) {
            try {
              const idToken = await fbUser.getIdToken();
              const authUser: AuthUser = {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split("@")[0] : "User"),
                photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.email || "User")}`,
                isDemo: false,
              };
              localStorage.removeItem("food_journal_demo_user");
              setUser(authUser);
              setToken(idToken);
            } catch (err) {
              console.error("Failed to get Firebase token:", err);
            }
          } else if (!localStorage.getItem("food_journal_demo_user")) {
            setUser(null);
            setToken(null);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    };

    setupAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const authInstance = activeAuth || (await initFirebaseAsync());
    if (!authInstance) throw new Error("Firebase Auth is not initialized. Please configure your Firebase environment variables or use Demo Mode.");
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(authInstance, email.trim(), pass);
      const idToken = await res.user.getIdToken();
      localStorage.removeItem("food_journal_demo_user");
      setUser({
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || email.split("@")[0],
        photoURL: res.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
        isDemo: false,
      });
      setToken(idToken);
    } catch (err: any) {
      console.error("Email login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, pass: string, displayName: string) => {
    const authInstance = activeAuth || (await initFirebaseAsync());
    if (!authInstance) throw new Error("Firebase Auth is not initialized. Please configure your Firebase environment variables or use Demo Mode.");
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(authInstance, email.trim(), pass);
      if (displayName.trim()) {
        await updateProfile(res.user, { displayName: displayName.trim() });
      }
      const idToken = await res.user.getIdToken();
      localStorage.removeItem("food_journal_demo_user");
      setUser({
        uid: res.user.uid,
        email: res.user.email,
        displayName: displayName.trim() || email.split("@")[0],
        photoURL: res.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || email)}`,
        isDemo: false,
      });
      setToken(idToken);
    } catch (err: any) {
      console.error("Email signup error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    const authInstance = activeAuth || (await initFirebaseAsync());
    if (!authInstance) throw new Error("Firebase Auth is not initialized. Please configure your Firebase environment variables or use Demo Mode.");
    setLoading(true);
    try {
      const result = await signInWithPopup(authInstance, googleProvider);
      const idToken = await result.user.getIdToken();
      localStorage.removeItem("food_journal_demo_user");
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || "Google User",
        photoURL: result.user.photoURL,
        isDemo: false,
      });
      setToken(idToken);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (demoName: string = "Dr. Nutritionist") => {
    setLoading(true);
    const mockUid = "demo_user_" + Math.random().toString(36).substring(2, 8);
    const demoUser: AuthUser = {
      uid: mockUid,
      email: `${mockUid}@example.com`,
      displayName: demoName,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${mockUid}`,
      isDemo: true,
    };
    localStorage.setItem("food_journal_demo_user", JSON.stringify(demoUser));
    setUser(demoUser);
    setToken(`demo-token-${mockUid}`);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem("food_journal_demo_user");
    const authInstance = activeAuth || (await initFirebaseAsync());
    if (authInstance && authInstance.currentUser) {
      try {
        await fbSignOut(authInstance);
      } catch {}
    }
    setUser(null);
    setToken(null);
    setLoading(false);
  };

  const getToken = async (): Promise<string | null> => {
    if (user?.isDemo) {
      return `demo-token-${user.uid}`;
    }
    const authInstance = activeAuth || (await initFirebaseAsync());
    if (authInstance && authInstance.currentUser) {
      return await authInstance.currentUser.getIdToken();
    }
    return token;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginAsDemo,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
