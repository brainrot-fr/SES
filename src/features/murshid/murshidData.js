/**
 * murshidData.js
 * Silsila-e-Tarbiyat and Silsila-e-Faqiri — bundled offline, per
 * feat-murshidObject.md. Simple ordered arrays; the Murshid page just
 * renders them top to bottom, same "add to the array, UI updates itself"
 * pattern as nuqoolObject and timelineEvents.
 *
 * Fill in the real chain here — placeholders below just establish the shape:
 * `name` is required, `title`/`years`/`note` are optional and only render
 * if present.
 */

export const silsilaETarbiyat = [
  {
    id: 1,
    name: 'Hazrat Syed Muhammad Jaunpuri A.S',
    name_ur: 'حضرت سید محمد جونپوری علیہ السلام',
    title: "Mahdi-e-Ma'ud",
    title_ur: 'مہدی موعود',
  },
  { id: 2, name: '' /* fill in next in chain */ },
  { id: 3, name: '' },
];

export const silsilaEFaqiri = [
  {
    id: 1,
    name: 'Hazrat Syed Muhammad Jaunpuri A.S',
    name_ur: 'حضرت سید محمد جونپوری علیہ السلام',
    title: "Mahdi-e-Ma'ud",
    title_ur: 'مہدی موعود',
  },
  { id: 2, name: '' /* fill in next in chain */ },
  { id: 3, name: '' },
];

export const hasPublishedMurshidLineage = [silsilaETarbiyat, silsilaEFaqiri]
  .some((entries) => entries.filter((entry) => entry.name?.trim()).length >= 2);