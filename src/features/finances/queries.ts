import "server-only";
import { TransactionType } from "@prisma/client";
import { db } from "@/lib/db";

// Accounts with a computed current balance: startBalance + income − expense.
// Decimal is converted to a plain number at this boundary for the client.
export async function getAccountsWithBalance() {
  const [accounts, sums] = await Promise.all([
    db.account.findMany({ orderBy: [{ archived: "asc" }, { createdAt: "asc" }] }),
    db.transaction.groupBy({
      by: ["accountId", "type"],
      _sum: { amount: true },
    }),
  ]);

  return accounts.map((a) => {
    const income = sums.find(
      (s) => s.accountId === a.id && s.type === TransactionType.INCOME,
    )?._sum.amount;
    const expense = sums.find(
      (s) => s.accountId === a.id && s.type === TransactionType.EXPENSE,
    )?._sum.amount;
    const start = a.startBalance.toNumber();
    const balance =
      start + (income?.toNumber() ?? 0) - (expense?.toNumber() ?? 0);
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      currency: a.currency,
      archived: a.archived,
      startBalance: start,
      balance,
    };
  });
}

export type AccountWithBalance = Awaited<
  ReturnType<typeof getAccountsWithBalance>
>[number];

// Recent transactions with account + category, amounts as numbers.
export async function getTransactions() {
  const rows = await db.transaction.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 500,
    include: {
      account: { select: { id: true, name: true, currency: true } },
      category: { select: { id: true, name: true, color: true } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount.toNumber(),
    date: t.date,
    note: t.note,
    account: t.account,
    category: t.category,
  }));
}

export type TransactionRow = Awaited<ReturnType<typeof getTransactions>>[number];

export async function getCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true, color: true },
  });
}

export type CategoryOption = Awaited<ReturnType<typeof getCategories>>[number];
