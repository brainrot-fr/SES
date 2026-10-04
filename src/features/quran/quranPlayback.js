export function shouldPlayOpeningBismillah(surahNumber, ayahNumber) {
  return ayahNumber === 1 && surahNumber !== 1 && surahNumber !== 9;
}
