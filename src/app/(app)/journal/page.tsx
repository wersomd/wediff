import type { Metadata } from "next";
import { JournalView } from "@/features/journal/components/journal-view";
import { getJournalEntries, getJournalStats } from "@/features/journal/queries";

export const metadata: Metadata = { title: "Дневник" };

export default async function JournalPage() {
  const [entries, stats] = await Promise.all([
    getJournalEntries(),
    getJournalStats(),
  ]);
  return <JournalView entries={entries} stats={stats} />;
}
