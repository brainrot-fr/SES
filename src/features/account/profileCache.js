const PROFILE_CACHE_KEY = "ses-profile-cache-v1";

export function readCachedProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) || "null");
  } catch {
    return null;
  }
}

export function cacheProfile(profile) {
  try {
    if (profile) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // Profile loading remains available if local storage is unavailable.
  }
}

export function clearProfileCache() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // A disabled local storage must not block authentication.
  }
}
