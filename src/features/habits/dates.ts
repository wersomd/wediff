import { addDays, format, startOfWeek, subDays } from "date-fns";

// Local calendar day key, e.g. "2026-06-27".
export function localDayKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// Key for a stored entry. Entries are written at UTC midnight of their day
// string, so the UTC date part equals that original local day key.
export function entryDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// The last `n` day keys ending today (oldest first).
export function lastDays(n: number): string[] {
  const today = new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(localDayKey(subDays(today, i)));
  return out;
}

export function todayKey(): string {
  return localDayKey(new Date());
}

// Consecutive completed days up to today (or yesterday if today isn't done yet).
export function currentStreak(done: Set<string>): number {
  let cursor = new Date();
  if (!done.has(localDayKey(cursor))) cursor = subDays(cursor, 1);
  let streak = 0;
  while (done.has(localDayKey(cursor))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

// Completions in the current week (Mon–Sun).
export function weekCount(done: Set<string>): number {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (done.has(localDayKey(addDays(monday, i)))) count++;
  }
  return count;
}
