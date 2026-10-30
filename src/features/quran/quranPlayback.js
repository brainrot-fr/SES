export function shouldPlayOpeningBismillah(surahNumber, ayahNumber) {
  return ayahNumber === 1 && surahNumber !== 1 && surahNumber !== 9;
}

export function findAyahAtElapsedTime(durations, elapsedSeconds) {
  if (durations.length === 0) return null;
  const safeDurations = durations.map((duration) =>
    Number.isFinite(duration) && duration > 0 ? duration : 0,
  );
  const totalDuration = safeDurations.reduce((total, duration) => total + duration, 0);
  if (totalDuration <= 0) return null;

  const requestedTime = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
  let remaining = Math.max(0, Math.min(requestedTime, totalDuration));
  for (let index = 0; index < safeDurations.length; index += 1) {
    const duration = safeDurations[index];
    if (remaining < duration || index === safeDurations.length - 1) {
      return { index, offset: Math.min(remaining, duration), duration };
    }
    remaining -= duration;
  }
  return null;
}
