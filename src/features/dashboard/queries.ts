import "server-only";
import { addDays, endOfDay, format } from "date-fns";
import { DebtStatus, TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getAccountsWithBalance } from "@/features/finances/queries";
import { computeDebtTotals, isOverdue } from "@/features/debts/summary";

export async function getDashboardSummary() {
  const now = new Date();
  const endToday = endOfDay(now);
  const todayKey = format(now, "yyyy-MM-dd");
  const todayDate = new Date(`${todayKey}T00:00:00.000Z`);
  const in7 = endOfDay(addDays(now, 7));

  const [
    dueTasks,
    openTaskCount,
    habits,
    accounts,
    upcomingSubs,
    pinnedNotes,
    openDebts,
  ] = await Promise.all([
    // Tasks due today or overdue, not finished.
    db.task.findMany({
      where: {
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueDate: { not: null, lte: endToday },
      },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { project: { select: { name: true, color: true } } },
    }),
    db.task.count({
      where: { status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] } },
    }),
    // Active habits with today's entry (if any) to compute done/total.
    db.habit.findMany({
      where: { archived: false },
      include: { entries: { where: { date: todayDate }, select: { id: true } } },
    }),
    getAccountsWithBalance(),
    db.subscription.findMany({
      where: { active: true, nextPaymentDate: { lte: in7 } },
      orderBy: { nextPaymentDate: "asc" },
      take: 6,
      include: { category: { select: { name: true } } },
    }),
    db.note.count({ where: { pinned: true } }),
    db.debt.findMany({
      where: { status: DebtStatus.OPEN },
      select: {
        direction: true,
        currency: true,
        status: true,
        dueDate: true,
        principal: true,
        payments: { select: { amount: true } },
      },
    }),
  ]);

  // Open debts → per-currency net balance + overdue count.
  const debtRows = openDebts.map((d) => {
    const paid = d.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    return {
      direction: d.direction,
      currency: d.currency,
      status: d.status,
      dueDate: d.dueDate,
      remaining: Math.max(d.principal.toNumber() - paid, 0),
    };
  });
  const debtTotals = computeDebtTotals(debtRows);
  const overdueDebts = debtRows.filter((d) =>
    isOverdue({ dueDate: d.dueDate, status: d.status }, now),
  ).length;

  // Balance totals per currency (active accounts).
  const balances: Record<string, number> = {};
  for (const a of accounts) {
    if (a.archived) continue;
    balances[a.currency] = (balances[a.currency] ?? 0) + a.balance;
  }

  return {
    tasks: {
      due: dueTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate as Date,
        priority: t.priority,
        project: t.project,
      })),
      openCount: openTaskCount,
    },
    habits: {
      doneToday: habits.filter((h) => h.entries.length > 0).length,
      total: habits.length,
    },
    balances,
    subscriptions: upcomingSubs.map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.amount.toNumber(),
      currency: s.currency,
      nextPaymentDate: s.nextPaymentDate,
      icon: s.icon,
      category: s.category,
    })),
    pinnedNotes,
    debts: {
      totals: debtTotals,
      overdue: overdueDebts,
    },
  };
}

export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;
