import "server-only";
import { addDays, endOfDay, endOfMonth, format, startOfMonth } from "date-fns";
import { DebtStatus, GoalStatus, TaskStatus, TransactionType } from "@prisma/client";
import { db } from "@/lib/db";
import { getAccountsWithBalance } from "@/features/finances/queries";
import { computeDebtTotals, isOverdue } from "@/features/debts/summary";
import { getAgenda } from "@/features/agenda/queries";

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
    activeGoals,
    todayEntry,
    agenda,
    monthlyTotals,
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
    db.goal.findMany({
      where: { status: GoalStatus.ACTIVE },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 8,
      include: { keyResults: { select: { done: true } } },
    }),
    db.journalEntry.findUnique({
      where: { date: todayDate },
      select: { mood: true },
    }),
    getAgenda(),
    // This month income + expense totals
    db.transaction.groupBy({
      by: ["type"],
      where: {
        date: { gte: startOfMonth(now), lte: endOfMonth(now) },
        category: { name: { not: "Перевод" } },
      },
      _sum: { amount: true },
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

  // Active goals with a computed progress %: numeric target → current/target,
  // otherwise key-results done/total.
  const goals = activeGoals.map((g) => {
    const target = g.targetValue ? g.targetValue.toNumber() : null;
    const current = g.currentValue.toNumber();
    const krTotal = g.keyResults.length;
    const krDone = g.keyResults.filter((k) => k.done).length;
    const progress =
      target && target > 0
        ? Math.min(100, Math.round((current / target) * 100))
        : krTotal > 0
          ? Math.round((krDone / krTotal) * 100)
          : 0;
    return { id: g.id, title: g.title, progress };
  });

  const monthIncome =
    monthlyTotals.find((r) => r.type === TransactionType.INCOME)?._sum.amount?.toNumber() ?? 0;
  const monthExpense =
    monthlyTotals.find((r) => r.type === TransactionType.EXPENSE)?._sum.amount?.toNumber() ?? 0;

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
    goals,
    todayMood: todayEntry?.mood ?? null,
    agenda: agenda.slice(0, 7),
    financeThisMonth: { income: monthIncome, expense: monthExpense },
  };
}

export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;
