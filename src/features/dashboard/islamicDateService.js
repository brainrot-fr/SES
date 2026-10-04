// AlAdhan's conversion is Saudi-based; only the four specified countries use
// the preceding Gregorian date to display one Hijri day behind Saudi Arabia.
const HIJRI_API_BASE = "https://api.aladhan.com/v1/gToH";
const HIJRI_CACHE_PREFIX = "ses-hijri-date-v1";
const HIJRI_LATEST_CACHE_PREFIX = "ses-hijri-date-latest-v1";
const BEHIND_SAUDI_COUNTRIES = new Set(["IN", "PK", "BD", "AF"]);
const HIJRI_MONTH_NAMES = {
  en: [
    "Muharram",
    "Safar",
    "Rabiʿ al-awwal",
    "Rabiʿ al-thani",
    "Jumada al-awwal",
    "Jumada al-thani",
    "Rajab",
    "Shaʿban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qiʿdah",
    "Dhu al-Hijjah",
  ],
  ur: [
    "محرم",
    "صفر",
    "ربیع الاول",
    "ربیع الثانی",
    "جمادی الاول",
    "جمادی الثانی",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذوالقعدہ",
    "ذوالحجہ",
  ],
};

function getSaudiGregorianDate(now) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function formatApiDate(dateParts, offsetDays = 0) {
  const date = new Date(
    Date.UTC(
      Number(dateParts.year),
      Number(dateParts.month) - 1,
      Number(dateParts.day) + offsetDays,
    ),
  );
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getUTCFullYear()}`;
}

function countryDateOffset(countryCode) {
  return BEHIND_SAUDI_COUNTRIES.has(countryCode?.toUpperCase()) ? -1 : 0;
}

async function fetchHijriForGregorianDate(apiDate, fetcher, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(`${HIJRI_API_BASE}/${apiDate}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`The Islamic calendar service returned ${response.status}.`);
    }
    const payload = await response.json();
    const hijri = payload?.data?.hijri;
    const day = Number(hijri?.day);
    const year = Number(hijri?.year);
    if (
      payload?.code !== 200 ||
      !Number.isInteger(day) ||
      !Number.isInteger(year) ||
      !Number.isInteger(hijri?.month?.number) ||
      hijri.month.number < 1 ||
      hijri.month.number > 12
    ) {
      throw new Error("The Islamic calendar service returned an unreadable date.");
    }
    return hijri;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getIslamicDateCountryOffset(countryCode) {
  return countryDateOffset(countryCode);
}

export function getIslamicDateCacheKey(apiDate, countryCode, locale) {
  return `${HIJRI_CACHE_PREFIX}:${apiDate}:${countryCode?.toUpperCase() || "SA"}:${locale === "ur" ? "ur" : "en"}`;
}

function getLatestDateCacheKey(countryCode, locale) {
  return `${HIJRI_LATEST_CACHE_PREFIX}:${countryCode?.toUpperCase() || "SA"}:${locale === "ur" ? "ur" : "en"}`;
}

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function formatHijriDate(apiDate, hijri, locale) {
  const language = locale === "ur" ? "ur" : "en";
  const numberFormat = new Intl.NumberFormat(language, { useGrouping: false });
  const monthName = HIJRI_MONTH_NAMES[language][hijri.month.number - 1] || hijri.month.en;
  return {
    apiDate,
    day: Number(hijri.day),
    month: hijri.month.number,
    year: Number(hijri.year),
    text: `${numberFormat.format(Number(hijri.day))} ${monthName} ${numberFormat.format(Number(hijri.year))}${language === "ur" ? "ھ" : " AH"}`,
  };
}

function readCachedDate(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || "null");
    return cached?.apiDate && cached?.text ? cached : null;
  } catch {
    return null;
  }
}

function writeCachedDate(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The calendar remains available when local storage is disabled.
  }
}

export async function getIslamicDate({
  countryCode = null,
  locale = "en",
  now = new Date(),
  fetcher = fetch,
  timeoutMs = 8000,
  onRefresh,
} = {}) {
  const dateParts = getSaudiGregorianDate(now);
  const apiDate = formatApiDate(dateParts, countryDateOffset(countryCode));
  const cacheKey = getIslamicDateCacheKey(apiDate, countryCode, locale);
  const latestCacheKey = getLatestDateCacheKey(countryCode, locale);
  const cached = readCachedDate(cacheKey);
  if (cached) {
    if (!isOffline()) void fetchHijriForGregorianDate(apiDate, fetcher, timeoutMs)
      .then((hijri) => {
        const refreshed = formatHijriDate(apiDate, hijri, locale);
        writeCachedDate(cacheKey, refreshed);
        writeCachedDate(latestCacheKey, refreshed);
        onRefresh?.(refreshed);
      })
      .catch(() => {});
    return { ...cached, isCached: true, isStale: isOffline() };
  }

  try {
    const hijri = await fetchHijriForGregorianDate(apiDate, fetcher, timeoutMs);
    const result = formatHijriDate(apiDate, hijri, locale);
    writeCachedDate(cacheKey, result);
    writeCachedDate(latestCacheKey, result);
    return result;
  } catch (error) {
    const lastKnownDate = readCachedDate(latestCacheKey);
    if (lastKnownDate) {
      return { ...lastKnownDate, isCached: true, isStale: true };
    }
    throw error;
  }
}
