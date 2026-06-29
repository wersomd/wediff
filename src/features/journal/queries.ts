import "server-only";
import { subDays } from "date-fns";
import { db } from "@/lib/db";

// Journal entries, newest first.
export async function getJournalEntries() {
  const rows = await db.journalEntry.findMany({
    orderBy: { date: "desc" },
    take: 365,
  });
  return rows.map((e) => ({
    id: e.id,
    date: e.date,
    mood: e.mood,
    content: e.content,
  }));
}

export type JournalEntryRow = Awaited<
  ReturnType<typeof getJournalEntries>
>[number];

// Average mood over the last 30 days + entry count, for the header stats.
export async function getJournalStats() {
  const since = subDays(new Date(), 30);
  const rows = await db.journalEntry.findMany({
    where: { date: { gte: since }, mood: { not: null } },
    select: { mood: true },
  });
  const count = rows.length;
  const avg =
    count > 0 ? rows.reduce((s, r) => s + (r.mood ?? 0), 0) / count : null;
  return { avgMood: avg, ratedDays: count };
}
