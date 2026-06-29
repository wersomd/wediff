import "server-only";
import { addDays, endOfDay } from "date-fns";
import { DebtStatus, GoalStatus, TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";

export type AgendaKind = "task" | "subscription" | "debt" | "goal";

export type AgendaItem = {
  id: string;
  kind: AgendaKind;
  title: string;
  date: Date;
  href: string;
  meta?: string;
};

// Everything with a date in the next 30 days (plus anything overdue), merged
// into one chronological list: task due dates, subscription payments, debt due
// dates and goal deadlines.
export async function getAgenda(): Promise<AgendaItem[]> {
  const now = new Date();
  const horizon = endOfDay(addDays(now, 30));

  const [tasks, subs, debts, goals] = await Promise.all([
    db.task.findMany({
      where: {
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueDate: { not: null, lte: horizon },
      },
      select: { id: true, title: true, dueDate: true },
    }),
    db.subscription.findMany({
      where: { active: true, nextPaymentDate: { lte: horizon } },
      select: { id: true, name: true, nextPaymentDate: true },
    }),
    db.debt.findMany({
      where: { status: DebtStatus.OPEN, dueDate: { not: null, lte: horizon } },
      select: {
        id: true,
        dueDate: true,
        counterparty: { select: { name: true } },
      },
    }),
    db.goal.findMany({
      where: { status: GoalStatus.ACTIVE, dueDate: { not: null, lte: horizon } },
      select: { id: true, title: true, dueDate: true },
    }),
  ]);

  const items: AgendaItem[] = [
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      kind: "task" as const,
      title: t.title,
      date: t.dueDate as Date,
      href: "/tasks",
    })),
    ...subs.map((s) => ({
      id: `sub-${s.id}`,
      kind: "subscription" as const,
      title: s.name,
      date: s.nextPaymentDate,
      href: "/subscriptions",
      meta: "Платёж",
    })),
    ...debts.map((d) => ({
      id: `debt-${d.id}`,
      kind: "debt" as const,
      title: d.counterparty.name,
      date: d.dueDate as Date,
      href: "/debts",
      meta: "Срок долга",
    })),
    ...goals.map((g) => ({
      id: `goal-${g.id}`,
      kind: "goal" as const,
      title: g.title,
      date: g.dueDate as Date,
      href: "/goals",
      meta: "Дедлайн цели",
    })),
  ];

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}
