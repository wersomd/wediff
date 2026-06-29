import type { Metadata } from "next";
import { GoalsView } from "@/features/goals/components/goals-view";
import { getGoals } from "@/features/goals/queries";

export const metadata: Metadata = { title: "Цели" };

export default async function GoalsPage() {
  const goals = await getGoals();
  return <GoalsView goals={goals} />;
}
