import "server-only";
import { db } from "@/lib/db";

// Goals with their key results, decimals converted to numbers. Active first.
export async function getGoals() {
  const goals = await db.goal.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { keyResults: { orderBy: { order: "asc" } } },
  });

  return goals.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    targetValue: g.targetValue ? g.targetValue.toNumber() : null,
    currentValue: g.currentValue.toNumber(),
    unit: g.unit,
    dueDate: g.dueDate,
    status: g.status,
    color: g.color,
    keyResults: g.keyResults.map((k) => ({
      id: k.id,
      title: k.title,
      done: k.done,
    })),
  }));
}

export type GoalRow = Awaited<ReturnType<typeof getGoals>>[number];
export type KeyResultRow = GoalRow["keyResults"][number];
