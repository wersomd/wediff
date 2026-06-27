import "server-only";
import { db } from "@/lib/db";

// Habits with their recent entries (last ~90 days) — enough for the day strip,
// streaks, and weekly progress without loading full history.
export async function getHabits() {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 90);
  since.setUTCHours(0, 0, 0, 0);

  return db.habit.findMany({
    orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
    include: {
      entries: {
        where: { date: { gte: since } },
        select: { id: true, date: true },
      },
    },
  });
}

export type HabitWithEntries = Awaited<ReturnType<typeof getHabits>>[number];
