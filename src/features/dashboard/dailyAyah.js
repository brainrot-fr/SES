export function getDailyAyahPosition(date, surahMeta) {
  const totalAyahs = surahMeta.reduce((total, surah) => total + surah.numberOfAyahs, 0);
  if (!Number.isFinite(totalAyahs) || totalAyahs <= 0) {
    throw new Error("Surah metadata must contain ayahs.");
  }

  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
  );
  let ayahIndex = ((day % totalAyahs) + totalAyahs) % totalAyahs;

  for (const surah of surahMeta) {
    if (ayahIndex < surah.numberOfAyahs) {
      return { surah, ayahIndex };
    }
    ayahIndex -= surah.numberOfAyahs;
  }

  throw new Error("Could not resolve the daily ayah.");
}
