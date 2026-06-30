"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoney } from "../money";
import type { CategoryStat } from "../lib/analytics";

const DEFAULT_COLOR = "#6b7280";

export function DonutChart({
  items,
  currency,
}: {
  items: CategoryStat[];
  currency: string;
}) {
  const total = items.reduce((s, i) => s + i.amount, 0);

  if (items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Нет данных за период
      </div>
    );
  }

  return (
    <div className="relative flex h-56 w-full items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={items}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            dataKey="amount"
            nameKey="name"
            paddingAngle={2}
          >
            {items.map((item, idx) => (
              <Cell
                key={item.id ?? idx}
                fill={item.color ?? DEFAULT_COLOR}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => {
              if (typeof value === "number") {
                return formatMoney(value, currency);
              }
              return "";
            }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Centered total inside the donut hole */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted-foreground">итого</span>
        <span className="text-sm font-semibold tabular-nums">{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}
