export function isAccountProfileComplete(profile) {
  return (
    (profile?.onboarding_gender === "girl" ||
      profile?.onboarding_gender === "boy") &&
    profile.follower_confirmed === true &&
    typeof profile.onboarding_completed_at === "string"
  );
}

export function getDisplayName(user) {
  const metadata = user?.user_metadata ?? {};
  return (
    metadata.display_name ||
    metadata.username ||
    metadata.full_name ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    ""
  ).trim();
}
