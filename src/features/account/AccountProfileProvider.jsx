import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/context/LanguageContext";
import AccountOnboarding from "@/features/account/AccountOnboarding";
import { isAccountProfileComplete } from "@/features/account/accountProfile";
import { AppShellSkeleton } from "@/components/layout/Page";
import { Button } from "@/components/shadcn/button";
import {
  cacheProfile as writeProfileCache,
  readCachedProfile,
} from "@/features/account/profileCache";

export { isAccountProfileComplete } from "@/features/account/accountProfile";

const AccountProfileContext = createContext(null);
const PROFILE_FIELDS =
  "id, onboarding_gender, follower_confirmed, country_code, onboarding_completed_at";

function createProfileError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function readCachedCompleteProfile(userId) {
  const profile = readCachedProfile();
  return profile?.id === userId && isAccountProfileComplete(profile)
    ? profile
    : null;
}

export function AccountProfileProvider({
  user,
  isAnonymous,
  authReady,
  children,
}) {
  const { t } = useLang();
  const userId =
    authReady && user && !isAnonymous ? user.id : null;
  const [profileState, setProfileState] = useState({
    userId: null,
    profile: null,
    loading: false,
    error: null,
    cachedProfile: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setProfileState({
        userId: null,
        profile: null,
        loading: false,
        error: null,
      });
      return () => {
        cancelled = true;
      };
    }

    setProfileState({
      userId,
      profile: null,
      loading: true,
      error: null,
    });

    supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setProfileState({
          userId,
          profile: data,
          loading: false,
          error,
          cachedProfile: error ? readCachedCompleteProfile(userId) : null,
        });
        if (!error) writeProfileCache(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setProfileState({
          userId,
          profile: null,
          loading: false,
          error,
          cachedProfile: readCachedCompleteProfile(userId),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const profileReady =
    !userId ||
    (profileState.userId === userId && !profileState.loading);
  const profile = profileState.userId === userId ? profileState.profile : null;

  const persistProfile = useCallback(
    async (changes) => {
      if (!userId) throw createProfileError("profile_sign_in_required");

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(changes)
        .eq("id", userId)
        .select(PROFILE_FIELDS)
        .maybeSingle();

      if (updateError) throw updateError;

      let data = updatedProfile;
      if (!data) {
        const { data: insertedProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, ...changes })
          .select(PROFILE_FIELDS)
          .single();

        if (insertError) throw insertError;
        data = insertedProfile;
      }

      setProfileState({
        userId,
        profile: data,
        loading: false,
        error: null,
        cachedProfile: null,
      });
      writeProfileCache(data);
      return data;
    },
    [userId],
  );

  const saveGender = useCallback(
    (onboardingGender) => {
      if (onboardingGender !== "girl" && onboardingGender !== "boy") {
        throw createProfileError("profile_gender_invalid");
      }
      return persistProfile({ onboarding_gender: onboardingGender });
    },
    [persistProfile],
  );

  const confirmFollower = useCallback(
    () => persistProfile({ follower_confirmed: true }),
    [persistProfile],
  );

  const completeOnboarding = useCallback(
    (countryCode = null) => {
      if (
        countryCode !== null &&
        !/^[A-Z]{2}$/.test(countryCode)
      ) {
        throw createProfileError("profile_country_invalid");
      }
      return persistProfile({
        country_code: countryCode,
        onboarding_completed_at: new Date().toISOString(),
      });
    },
    [persistProfile],
  );

  const retryProfileLoad = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const continueWithCachedProfile = useCallback(() => {
    const cachedProfile = profileState.userId === userId
      ? profileState.cachedProfile
      : null;
    if (!cachedProfile || !isAccountProfileComplete(cachedProfile)) return;
    setProfileState({
      userId,
      profile: cachedProfile,
      loading: false,
      error: null,
      cachedProfile,
    });
  }, [profileState.cachedProfile, profileState.userId, userId]);

  const value = useMemo(
    () => ({
      profile,
      viewerGender: profile?.onboarding_gender || null,
      profileReady,
      profileError:
        profileState.userId === userId ? profileState.error : null,
      isProfileComplete: isAccountProfileComplete(profile),
      saveGender,
      confirmFollower,
      completeOnboarding,
      retryProfileLoad,
      continueWithCachedProfile,
    }),
    [
      profile,
      profile?.onboarding_gender,
      profileReady,
      profileState.error,
      profileState.userId,
      userId,
      saveGender,
      confirmFollower,
      completeOnboarding,
      retryProfileLoad,
      continueWithCachedProfile,
    ],
  );

  return (
    <AccountProfileContext.Provider value={value}>
      {userId ? (
        !profileReady ? (
          <ProfileStatus message={t("accountProfileLoading")} />
        ) : profileState.error ? (
          <ProfileLoadError
            onRetry={retryProfileLoad}
            onContinueOffline={continueWithCachedProfile}
            canContinueOffline={isAccountProfileComplete(profileState.cachedProfile)}
          />
        ) : isAccountProfileComplete(profile) ? (
          children
        ) : (
          <AccountOnboarding />
        )
      ) : (
        children
      )}
    </AccountProfileContext.Provider>
  );
}

export function useAccountProfile() {
  const context = useContext(AccountProfileContext);
  if (!context) {
    throw createProfileError("account_profile_context_missing");
  }
  return context;
}

function ProfileStatus({ message }) {
  return <AppShellSkeleton label={message} />;
}

function ProfileLoadError({ onRetry, onContinueOffline, canContinueOffline }) {
  const { t } = useLang();
  return (
    <main className="account-onboarding">
      <section className="account-onboarding__card" aria-labelledby="profile-load-title">
        <p className="account-onboarding__eyebrow">{t("accountSetupEyebrow")}</p>
        <h1 className="account-onboarding__title" id="profile-load-title">{t("accountProfileErrorTitle")}</h1>
        <p className="account-onboarding__copy" role="alert">{t("accountProfileError")}</p>
        <Button
          variant="onboarding"
          type="button"
          onClick={onRetry}
        >
          {t("accountTryAgain")}
        </Button>
        {canContinueOffline && (
          <Button
            variant="onboardingOutline"
            type="button"
            onClick={onContinueOffline}
          >
            {t("accountContinueOffline")}
          </Button>
        )}
      </section>
    </main>
  );
}
