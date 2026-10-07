import "server-only";
import { addDays, endOfDay } from "date-fns";
import { DebtStatus, WishStatus } from "@prisma/client";
import { OPEN_TASK_STATUSES } from "@/features/tasks/constants";
import { db } from "@/lib/db";
import { getAccountsWithBalance } from "@/features/finances/queries";
import { computeDebtTotals, isOverdue } from "@/features/debts/summary";

export async function getDashboardSummary() {
  const now = new Date();
  const endToday = endOfDay(now);
  const in7 = endOfDay(addDays(now, 7));

  const [dueTaskCount, openTaskCount, accounts, upcomingSubs, openDebts] =
    await Promise.all([
      // Tasks due today or overdue, not finished.
      db.task.count({
        where: {
          status: { in: OPEN_TASK_STATUSES },
          dueDate: { not: null, lte: endToday },
        },
      }),
      db.task.count({
        where: { status: { in: OPEN_TASK_STATUSES } },
      }),
      getAccountsWithBalance(),
      db.subscription.findMany({
        where: { active: true, nextPaymentDate: { lte: in7 } },
        orderBy: { nextPaymentDate: "asc" },
        take: 1,
      }),
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
      dueCount: dueTaskCount,
      openCount: openTaskCount,
    },
    balances,
    subscriptions: upcomingSubs.map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.amount.toNumber(),
      currency: s.currency,
      nextPaymentDate: s.nextPaymentDate,
      icon: s.icon,
    })),
    debts: {
      totals: debtTotals,
      overdue: overdueDebts,
    },
  };
}

export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;

// Personal group summary for the Home screen's "Личное" tile.
export async function getPersonalSummary() {
  const [pinnedNotesCount, wishlistHighlights, bookmarkCount] =
    await Promise.all([
      db.note.count({ where: { pinned: true } }),
      db.wishItem.findMany({
        where: { status: WishStatus.WANT },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true },
      }),
      db.bookmark.count({ where: { isArchived: false } }),
    ]);

  return { pinnedNotesCount, wishlistHighlights, bookmarkCount };
}

export type PersonalSummary = Awaited<ReturnType<typeof getPersonalSummary>>;
