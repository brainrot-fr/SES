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
  useMemo,
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
  requestPasswordReset,
  updateRecoveredPassword,
  resendSignupConfirmation,
  signOut as signOutSession,
  deleteAccount as deleteAccountSession,
} from "@/features/auth/authSession";
import { AccountProfileProvider } from "@/features/account/AccountProfileProvider";
import { useLang } from "@/context/LanguageContext";
import { toast } from "sonner";
import { friendlyError } from "@/lib/supabaseClient.js";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const { t } = useLang();
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [upgradeConfirmed, setUpgradeConfirmed] = useState(false);
  const [upgradeError, setUpgradeError] = useState(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

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

    const unsubscribe = onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
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

  useEffect(() => {
    if (!upgradeError) return;
    toast(friendlyError(upgradeError, t, "authGenericError"));
    setUpgradeError(null);
  }, [upgradeError, t]);

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
    (username, email, password) => signUpWithPassword(username, email, password),
    [],
  );
  const sendPasswordReset = useCallback(
    (email) => requestPasswordReset(email),
    [],
  );
  const resendSignup = useCallback(
    (email) => resendSignupConfirmation(email),
    [],
  );
  const saveRecoveredPassword = useCallback(
    (password) => updateRecoveredPassword(password),
    [],
  );
  const finishPasswordRecovery = useCallback(
    () => setPasswordRecovery(false),
    [],
  );
  const signOut = useCallback(() => signOutSession(), []);
  const deleteAccount = useCallback(() => deleteAccountSession(), []);
  const clearUpgradeConfirmed = useCallback(
    () => setUpgradeConfirmed(false),
    [],
  );
  const value = useMemo(
    () => ({
      ready,
      session,
      user,
      isAnonymous,
      startEmailUpgrade,
      upgradeConfirmed,
      upgradeError,
      passwordRecovery,
      sendPasswordReset,
      resendSignup,
      saveRecoveredPassword,
      finishPasswordRecovery,
      clearUpgradeConfirmed,
      signIn,
      signInGoogle,
      signUp,
      signOut,
      deleteAccount,
    }),
    [
      ready,
      session,
      user,
      isAnonymous,
      startEmailUpgrade,
      upgradeConfirmed,
      upgradeError,
      passwordRecovery,
      sendPasswordReset,
      resendSignup,
      saveRecoveredPassword,
      finishPasswordRecovery,
      clearUpgradeConfirmed,
      signIn,
      signInGoogle,
      signUp,
      signOut,
      deleteAccount,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      <AccountProfileProvider
        user={user}
        isAnonymous={isAnonymous}
        authReady={ready}
      >
        {children}
      </AccountProfileProvider>
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
