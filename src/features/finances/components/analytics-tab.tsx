"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "../money";
import { computeAnalytics, PERIOD_LABELS, type Period } from "../lib/analytics";
import { DonutChart } from "./donut-chart";
import type { TransactionRow } from "../queries";

const PERIODS: Period[] = ["month", "last_month", "3m", "6m", "year", "all"];
const DEFAULT_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#10b981",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899","#64748b",
];

export function AnalyticsTab({ transactions }: { transactions: TransactionRow[] }) {
  const [period, setPeriod] = useState<Period>("month");

  const { income, expense, byCategory } = computeAnalytics(transactions, period);
  const net = income - expense;

  // Assign fallback colors to categories that have none
  const coloredCategories = byCategory.map((c, i) => ({
    ...c,
    color: c.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Доходы" value={income} className="text-emerald-500" />
        <SummaryCard label="Расходы" value={expense} className="text-destructive" />
        <SummaryCard
          label="Сальдо"
          value={net}
          className={net >= 0 ? "text-emerald-500" : "text-destructive"}
        />
      </div>

      {/* Chart + category list */}
      {byCategory.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Нет расходов за выбранный период.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <DonutChart items={coloredCategories} currency="KZT" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Расходы по категориям</h3>
            <ul className="space-y-1.5">
              {coloredCategories.map((cat) => {
                const pct = expense > 0 ? Math.round((cat.amount / expense) * 100) : 0;
                return (
                  <li key={cat.id ?? cat.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: cat.color ?? "#6b7280" }}
                    />
                    <span className="flex-1 truncate">{cat.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
                    <span className="w-28 shrink-0 text-right tabular-nums font-medium">
                      {formatMoney(cat.amount, "KZT")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", className)}>
        {formatMoney(value, "KZT")}
      </p>
    </div>
  );
}
