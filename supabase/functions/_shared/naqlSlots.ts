export const NAQL_REMINDER_SLOTS = [
  { hour: 5, minute: 0 },
  { hour: 8, minute: 0 },
  { hour: 11, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 0 },
  { hour: 17, minute: 0 },
  { hour: 20, minute: 0 },
] as const;

export function slotsForNaqlReminders(count: number) {
  if (count <= 0) return [];
  if (count >= NAQL_REMINDER_SLOTS.length) return [...NAQL_REMINDER_SLOTS];

  const indices = Array.from({ length: count }, (_, index) =>
    count === 1
      ? Math.floor((NAQL_REMINDER_SLOTS.length - 1) / 2)
      : Math.round(index * (NAQL_REMINDER_SLOTS.length - 1) / (count - 1)),
  );
  return indices.map((index) => NAQL_REMINDER_SLOTS[index]);
}
