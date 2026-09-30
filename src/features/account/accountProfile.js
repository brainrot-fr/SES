export function isAccountProfileComplete(profile) {
  return (
    (profile?.onboarding_gender === "Female" ||
      profile?.onboarding_gender === "Male") &&
    profile.follower_confirmed === true &&
    typeof profile.onboarding_completed_at === "string"
  );
}
