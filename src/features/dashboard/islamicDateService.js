// AlAdhan's conversion is Saudi-based; only the four specified countries use
// the preceding Gregorian date to display one Hijri day behind Saudi Arabia.
const HIJRI_API_BASE = "https://api.aladhan.com/v1/gToH";
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

export async function getIslamicDate({
  countryCode = null,
  locale = "en",
  now = new Date(),
  fetcher = fetch,
  timeoutMs = 8000,
} = {}) {
  const dateParts = getSaudiGregorianDate(now);
  const apiDate = formatApiDate(dateParts, countryDateOffset(countryCode));
  const hijri = await fetchHijriForGregorianDate(apiDate, fetcher, timeoutMs);
  const language = locale === "ur" ? "ur" : "en";
  const numberFormat = new Intl.NumberFormat(language, {
    useGrouping: false,
  });
  const monthName =
    HIJRI_MONTH_NAMES[language][hijri.month.number - 1] ||
    hijri.month.en;

  return {
    apiDate,
    day: Number(hijri.day),
    month: hijri.month.number,
    year: Number(hijri.year),
    text: `${numberFormat.format(Number(hijri.day))} ${monthName} ${numberFormat.format(Number(hijri.year))}${language === "ur" ? "ھ" : " AH"}`,
  };
}
