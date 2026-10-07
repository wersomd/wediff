import "server-only";
import { addDays, endOfDay, format } from "date-fns";
import { DebtStatus, GoalStatus } from "@prisma/client";
import { OPEN_TASK_STATUSES } from "@/features/tasks/constants";
import { dayKey, localEventTime } from "@/lib/workspace-date";
import { db } from "@/lib/db";

export type CalendarKind = "task" | "subscription" | "debt" | "goal" | "event";

export type CalendarItem = {
  id: string;
  kind: CalendarKind;
  title: string;
  date: Date;
  href: string;
  meta?: string;
};

export type DateRange = { from: Date; to: Date };

// For the 4 aggregated due-date sources: when the visible range includes
// "today", drop the lower bound so anything overdue still surfaces on
// today's cell (matches the old agenda page's behavior). Otherwise use the
// exact range, so viewing a past/future month doesn't get flooded with
// old overdue items that don't belong to it.
function dueDateWindow(range: DateRange) {
  const from = localEventTime(format(range.from, "yyyy-MM-dd"));
  const to = new Date(`${format(range.to, "yyyy-MM-dd")}T23:59:59.999Z`);
  const today = new Date(`${dayKey()}T00:00:00Z`);
  if (from <= today && today <= to) return { lte: to };
  return { gte: from, lte: to };
}

// Merges task/goal/debt/subscription due dates with freeform calendar
// events into one chronological list for the given range.
export async function getCalendarItems(range: DateRange): Promise<CalendarItem[]> {
  const dueWindow = dueDateWindow(range);

  const [tasks, subs, debts, goals, events] = await Promise.all([
    db.task.findMany({
      where: {
        status: { in: OPEN_TASK_STATUSES },
        dueDate: { not: null, ...dueWindow },
      },
      select: { id: true, title: true, dueDate: true },
    }),
    db.subscription.findMany({
      where: { active: true, nextPaymentDate: dueWindow },
      select: { id: true, name: true, nextPaymentDate: true },
    }),
    db.debt.findMany({
      where: { status: DebtStatus.OPEN, dueDate: { not: null, ...dueWindow } },
      select: { id: true, dueDate: true, counterparty: { select: { name: true } } },
    }),
    db.goal.findMany({
      where: { status: GoalStatus.ACTIVE, dueDate: { not: null, ...dueWindow } },
      select: { id: true, title: true, dueDate: true },
    }),
    db.calendarEvent.findMany({
      where: { startAt: { gte: localEventTime(format(range.from, "yyyy-MM-dd")), lt: new Date(localEventTime(format(range.to, "yyyy-MM-dd")).getTime() + 86400000) } },
      select: { id: true, title: true, startAt: true, note: true },
    }),
  ]);

  const items: CalendarItem[] = [
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      kind: "task" as const,
      title: t.title,
      date: t.dueDate as Date,
      href: `/tasks?item=${encodeURIComponent(t.id)}`,
    })),
    ...subs.map((s) => ({
      id: `sub-${s.id}`,
      kind: "subscription" as const,
      title: s.name,
      date: s.nextPaymentDate,
      href: `/subscriptions?item=${encodeURIComponent(s.id)}`,
      meta: "Платёж",
    })),
    ...debts.map((d) => ({
      id: `debt-${d.id}`,
      kind: "debt" as const,
      title: d.counterparty.name,
      date: d.dueDate as Date,
      href: `/debts?item=${encodeURIComponent(d.id)}`,
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
    ...events.map((e) => ({
      id: `event-${e.id}`,
      kind: "event" as const,
      title: e.title,
      date: e.startAt,
      href: `/calendar?day=${dayKey(e.startAt)}`,
      meta: e.note ?? undefined,
    })),
  ];

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Next 30 days + anything overdue, as a flat chronological list — same
// semantics the old agenda page/dashboard panel used.
export async function getUpcomingItems(): Promise<CalendarItem[]> {
  const now = new Date();
  const horizon = endOfDay(addDays(now, 30));
  return getCalendarItems({ from: new Date(0), to: horizon });
}
