/**
 * AuthContext.jsx
 * App-wide identity state, mirroring the shape of LanguageContext.
 *
 * - Establishes (or resumes) the anonymous session once on mount.
 * - Exposes the current user, whether it's still anonymous, and the two
 *   upgrade steps (request code / confirm code) for the backup-data flow.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  ensureAnonymousSession,
  onAuthStateChange,
  isAnonymousUser,
  requestEmailUpgrade,
  listenForEmailUpgradeConfirmation,
  signInWithPassword,
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
        const s = await ensureAnonymousSession();
        if (!cancelled) setSession(s);
      } catch (err) {
        console.error("[AuthProvider] failed to establish session", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    const unsubscribe = onAuthStateChange((_event, s) => {
      setSession(s);
    });

    const stopListening = listenForEmailUpgradeConfirmation(
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
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
