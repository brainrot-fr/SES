/**
 * AuthContext.jsx
 * App-wide identity state, mirroring the shape of LanguageContext.
 *
 * - Restores any existing Supabase session once on mount.
 * - Exposes auth state and account operations to the app.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  getCurrentSession,
  onAuthStateChange,
  isAnonymousUser,
  requestEmailUpgrade,
  listenForAuthRedirect,
  signInWithPassword,
  signInWithGoogle,
  signUpWithPassword,
  signOut as signOutSession,
  deleteAccount as deleteAccountSession,
} from "../features/auth/authSession";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [upgradeConfirmed, setUpgradeConfirmed] = useState(false);
  const [upgradeError, setUpgradeError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const s = await getCurrentSession();
        if (!cancelled) setSession(s);
      } catch (err) {
        console.error("[AuthProvider] failed to load session", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    const unsubscribe = onAuthStateChange((_event, s) => {
      setSession(s);
    });

    const stopListening = listenForAuthRedirect(
      (s) => {
        setSession(s);
        setUpgradeConfirmed(true);
      },
      (err) => setUpgradeError(err),
    );

    return () => {
      cancelled = true;
      unsubscribe();
      stopListening();
    };
  }, []);

  const user = session?.user ?? null;
  const isAnonymous = isAnonymousUser(user);

  const startEmailUpgrade = useCallback(
    (email, password) => requestEmailUpgrade(email, password),
    [],
  );
  const signIn = useCallback(
    (email, password) => signInWithPassword(email, password),
    [],
  );
  const signInGoogle = useCallback(() => signInWithGoogle(), []);
  const signUp = useCallback(
    (email, password) => signUpWithPassword(email, password),
    [],
  );
  const signOut = useCallback(() => signOutSession(), []);
  const deleteAccount = useCallback(() => deleteAccountSession(), []);

  return (
    <Ctx.Provider
      value={{
        ready,
        session,
        user,
        isAnonymous,
        startEmailUpgrade,
        upgradeConfirmed,
        upgradeError,
        clearUpgradeConfirmed: () => setUpgradeConfirmed(false),
        signIn,
        signInGoogle,
        signUp,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
