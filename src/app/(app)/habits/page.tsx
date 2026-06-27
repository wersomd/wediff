import type { Metadata } from "next";
import { HabitsView } from "@/features/habits/components/habits-view";
import { getHabits } from "@/features/habits/queries";

export const metadata: Metadata = { title: "Habits" };

export default async function HabitsPage() {
  const habits = await getHabits();
  return <HabitsView habits={habits} />;
}
