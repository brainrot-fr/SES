export function isAccountProfileComplete(profile) {
  return (
    (profile?.onboarding_gender === "girl" ||
      profile?.onboarding_gender === "boy") &&
    profile.follower_confirmed === true &&
    typeof profile.onboarding_completed_at === "string"
  );
}
