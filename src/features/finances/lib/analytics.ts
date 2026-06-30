import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { TransactionType } from "@prisma/client";
import type { TransactionRow } from "../queries";

export type Period = "month" | "last_month" | "3m" | "6m" | "year" | "all";

export const PERIOD_LABELS: Record<Period, string> = {
  month: "Этот месяц",
  last_month: "Прошлый месяц",
  "3m": "3 месяца",
  "6m": "6 месяцев",
  year: "Этот год",
  all: "За всё время",
};

export function getDateRange(period: Period): { from: Date; to: Date } | null {
  const now = new Date();
  if (period === "all") return null;
  if (period === "month") return { from: startOfMonth(now), to: endOfMonth(now) };
  if (period === "last_month") {
    const prev = subMonths(now, 1);
    return { from: startOfMonth(prev), to: endOfMonth(prev) };
  }
  if (period === "3m") return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
  if (period === "6m") return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
  // year
  return { from: startOfYear(now), to: endOfYear(now) };
}

export type CategoryStat = {
  id: string | null;
  name: string;
  color: string | null;
  amount: number;
};

const TRANSFER_NAME = "Перевод";

export function computeAnalytics(
  transactions: TransactionRow[],
  period: Period,
): { income: number; expense: number; byCategory: CategoryStat[] } {
  const range = getDateRange(period);

  const filtered = transactions.filter((t) => {
    if (t.category?.name === TRANSFER_NAME) return false;
    if (!range) return true;
    const d = new Date(t.date);
    return d >= range.from && d <= range.to;
  });

  let income = 0;
  let expense = 0;
  const catMap = new Map<string, CategoryStat>();

  for (const t of filtered) {
    if (t.type === TransactionType.INCOME) {
      income += t.amount;
    } else {
      expense += t.amount;
      const key = t.category?.id ?? "__none__";
      const existing = catMap.get(key);
      if (existing) {
        existing.amount += t.amount;
      } else {
        catMap.set(key, {
          id: t.category?.id ?? null,
          name: t.category?.name ?? "Без категории",
          color: t.category?.color ?? null,
          amount: t.amount,
        });
      }
    }
  }

  const byCategory = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount);

  return { income, expense, byCategory };
}
