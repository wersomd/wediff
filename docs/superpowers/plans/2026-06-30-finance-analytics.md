# Finance Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add analytics with a donut chart, custom category management, and a refreshed dashboard to `/finances`.

**Architecture:** All data is already fetched server-side in `FinancesPage`; analytics are computed client-side from the existing `transactions` array (max 500 rows). Tab state lives in client state — no URL change. Categories gain full CRUD with color pickers. The dashboard replaces the Debts StatCard with an Expenses card and adds a Finance panel + Debts panel at the bottom.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, Prisma 6, Zod 4, Recharts, shadcn/ui primitives, lucide-react, Sonner toasts.

## Global Constraints

- Package manager: `/Users/wersomd/Library/pnpm/bin/pnpm` (always use full path in shell, or `export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"` first)
- Tailwind v4 — no `tailwind.config.js`; tokens live in `src/app/globals.css`. Use only standard Tailwind utility classes or CSS variables already defined there.
- Money: `Decimal(14,2)` in DB, `number` on client. Use `formatMoney(amount, currency)` from `@/features/finances/money`.
- No emoji in category names or UI. Clean text + hex color only.
- `TransactionType` enum: `INCOME | EXPENSE` (from `@prisma/client`).
- "Перевод" category name is reserved for internal transfers — exclude it from all analytics.
- Server Actions must call `requireAuth()` first, then `revalidatePath("/finances")` on success.
- Verification step: `export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH" && pnpm build` must pass with no TypeScript errors.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `recharts` dependency |
| `src/features/finances/schema.ts` | Modify | Add `categoryCreateSchema`, `categoryUpdateSchema` |
| `src/features/finances/queries.ts` | Modify | Add `getCategoriesWithCount` |
| `src/features/finances/actions.ts` | Modify | Add `createCategory`, `updateCategory`, `deleteCategory` |
| `src/features/finances/lib/analytics.ts` | Create | Pure functions: period ranges, expense aggregation by category |
| `src/features/finances/components/donut-chart.tsx` | Create | Recharts `PieChart` wrapper (client component) |
| `src/features/finances/components/analytics-tab.tsx` | Create | Period selector + summary cards + donut + category table |
| `src/features/finances/components/category-dialog.tsx` | Create | Add/edit category dialog with color swatch picker |
| `src/features/finances/components/categories-tab.tsx` | Create | Category list with CRUD, type toggle |
| `src/features/finances/components/finances-view.tsx` | Modify | Add tab navigation (Обзор / Аналитика / Категории) |
| `src/app/(app)/finances/page.tsx` | Modify | Fetch `getCategoriesWithCount` instead of `getCategories` |
| `src/features/dashboard/queries.ts` | Modify | Add `financeThisMonth` to `getDashboardSummary` |
| `src/app/(app)/dashboard/page.tsx` | Modify | Replace Debts StatCard → Expenses StatCard; add FinancePanel + DebtPanel at bottom |

---

## Task 1: Install Recharts

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `recharts` importable as `import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"`

- [ ] **Step 1: Install recharts**

```bash
export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"
pnpm add recharts
```

Expected output ends with: `Done in ...s using pnpm`

- [ ] **Step 2: Verify TypeScript sees it**

```bash
export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"
node -e "require('./node_modules/recharts/dist/cjs/index.js'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add recharts"
```

---

## Task 2: Category Schemas, Queries & Actions

**Files:**
- Modify: `src/features/finances/schema.ts`
- Modify: `src/features/finances/queries.ts`
- Modify: `src/features/finances/actions.ts`

**Interfaces:**
- Produces:
  - `categoryCreateSchema` — `{ name: string, type: TransactionType, color: string }`
  - `categoryUpdateSchema` — extends with `id: string`
  - `getCategoriesWithCount()` → `CategoryWithCount[]` where each item has `{ id, name, type, color, _count: { transactions: number } }`
  - `createCategory(input: unknown): Promise<ActionResult>`
  - `updateCategory(input: unknown): Promise<ActionResult>`
  - `deleteCategory(id: string): Promise<ActionResult>` — returns `{ error }` if category has transactions

- [ ] **Step 1: Add schemas to `src/features/finances/schema.ts`**

Append at the bottom of the existing file (after `budgetSchema`):

```typescript
export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(60),
  type: z.nativeEnum(TransactionType),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
});

export const categoryUpdateSchema = categoryCreateSchema.extend({
  id: z.string().min(1),
});
```

- [ ] **Step 2: Add `getCategoriesWithCount` to `src/features/finances/queries.ts`**

Append after the existing `getCategories` function:

```typescript
export async function getCategoriesWithCount() {
  const rows = await db.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      color: true,
      _count: { select: { transactions: true } },
    },
  });
  return rows;
}

export type CategoryWithCount = Awaited<ReturnType<typeof getCategoriesWithCount>>[number];
```

- [ ] **Step 3: Add category actions to `src/features/finances/actions.ts`**

Add the following imports at the top of `actions.ts` (after existing imports):

```typescript
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from "./schema";
```

Then append these three functions at the bottom of `actions.ts`:

```typescript
// ── Categories ────────────────────────────────────────────────────────────────
export async function createCategory(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = categoryCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { name, type, color } = parsed.data;
  const existing = await db.category.findUnique({ where: { name_type: { name, type } } });
  if (existing) return { error: "Категория с таким названием уже существует" };
  await db.category.create({ data: { name, type, color } });
  revalidatePath("/finances");
  return { ok: true };
}

export async function updateCategory(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = categoryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, name, color } = parsed.data;
  await db.category.update({ where: { id }, data: { name, color } });
  revalidatePath("/finances");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  const count = await db.transaction.count({ where: { categoryId: id } });
  if (count > 0) {
    return { error: `Нельзя удалить: категория используется в ${count} транзакциях` };
  }
  await db.category.delete({ where: { id } });
  revalidatePath("/finances");
  return { ok: true };
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"
pnpm build 2>&1 | tail -20
```

Expected: build succeeds (exit 0). Fix any type errors before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/features/finances/schema.ts src/features/finances/queries.ts src/features/finances/actions.ts
git commit -m "feat(finances): category CRUD — schemas, queries, actions"
```

---

## Task 3: Analytics Utilities

**Files:**
- Create: `src/features/finances/lib/analytics.ts`

**Interfaces:**
- Consumes: `TransactionRow` from `@/features/finances/queries`
- Produces:
  - `type Period = 'month' | 'last_month' | '3m' | '6m' | 'year' | 'all'`
  - `PERIOD_LABELS: Record<Period, string>`
  - `getDateRange(period: Period): { from: Date; to: Date } | null` — null means all time
  - `type CategoryStat = { id: string | null; name: string; color: string | null; amount: number }`
  - `computeAnalytics(transactions: TransactionRow[], period: Period): { income: number; expense: number; byCategory: CategoryStat[] }`
  - `byCategory` excludes the "Перевод" category, sorted by amount descending

- [ ] **Step 1: Create `src/features/finances/lib/analytics.ts`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"
pnpm build 2>&1 | tail -20
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/finances/lib/analytics.ts
git commit -m "feat(finances): analytics computation utilities"
```

---

## Task 4: Donut Chart Component

**Files:**
- Create: `src/features/finances/components/donut-chart.tsx`

**Interfaces:**
- Consumes: `CategoryStat` from `@/features/finances/lib/analytics`
- Produces: `<DonutChart items={CategoryStat[]} currency={string} />`

**Notes:**
- Must be `"use client"` — recharts renders client-side only
- `ResponsiveContainer` wraps `PieChart` so it fills its parent
- Default color for segments with no color: `#6b7280` (gray-500)
- Show a centered total (sum of all items) inside the donut hole via absolute positioning

- [ ] **Step 1: Create `src/features/finances/components/donut-chart.tsx`**

```typescript
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
            formatter={(value: number) => formatMoney(value, currency)}
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"
pnpm build 2>&1 | tail -20
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/finances/components/donut-chart.tsx
git commit -m "feat(finances): DonutChart component (recharts)"
```

---

## Task 5: Analytics Tab

**Files:**
- Create: `src/features/finances/components/analytics-tab.tsx`

**Interfaces:**
- Consumes:
  - `TransactionRow` from `../queries`
  - `computeAnalytics`, `PERIOD_LABELS`, `Period` from `../lib/analytics`
  - `DonutChart` from `./donut-chart`
  - `formatMoney` from `../money`
- Produces: `<AnalyticsTab transactions={TransactionRow[]} />`

**Layout:**
```
Period selector (pill buttons)
─────────────────────────────────
[Income card] [Expense card] [Net card]
─────────────────────────────────
[DonutChart (left, ~half width)] | [Category list (right)]
```

- [ ] **Step 1: Create `src/features/finances/components/analytics-tab.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"
pnpm build 2>&1 | tail -20
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/finances/components/analytics-tab.tsx
git commit -m "feat(finances): AnalyticsTab with period selector and donut"
```

---

## Task 6: Category Dialog & Categories Tab

**Files:**
- Create: `src/features/finances/components/category-dialog.tsx`
- Create: `src/features/finances/components/categories-tab.tsx`

**Interfaces:**
- Consumes:
  - `CategoryWithCount` from `../queries`
  - `createCategory`, `updateCategory`, `deleteCategory` from `../actions`
  - `TransactionType` from `@prisma/client`
  - Dialog, Input, Button, Label, Select from `@/components/ui/*`
- Produces:
  - `<CategoryDialog open={boolean} onOpenChange={(o:boolean)=>void} category={CategoryWithCount|null} defaultType={TransactionType} />`
  - `<CategoriesTab categories={CategoryWithCount[]} />`

**Color palette** (12 swatches — no emoji):
`#ef4444 #f97316 #eab308 #22c55e #10b981 #06b6d4 #3b82f6 #8b5cf6 #ec4899 #64748b #a16207 #7c3aed`

- [ ] **Step 1: Create `src/features/finances/components/category-dialog.tsx`**

```typescript
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TransactionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createCategory, updateCategory } from "../actions";
import type { CategoryWithCount } from "../queries";

const PALETTE = [
  "#ef4444","#f97316","#eab308","#22c55e","#10b981",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899","#64748b",
  "#a16207","#7c3aed",
];

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryWithCount | null;
  defaultType: TransactionType;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(category);

  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[6]); // blue default

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setColor(category?.color ?? PALETTE[6]);
  }, [open, category]);

  function submit() {
    start(async () => {
      const payload = isEdit
        ? { id: category!.id, name, type: category!.type, color }
        : { name, type: defaultType, color };

      const res = isEdit ? await updateCategory(payload) : await createCategory(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Категория обновлена" : "Категория добавлена");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Название</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Продукты"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Цвет</Label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110",
                    color === c ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span
                className="size-7 shrink-0 rounded-full border border-border"
                style={{ background: color }}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `src/features/finances/components/categories-tab.tsx`**

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { TransactionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteCategory } from "../actions";
import { CategoryDialog } from "./category-dialog";
import type { CategoryWithCount } from "../queries";

export function CategoriesTab({ categories }: { categories: CategoryWithCount[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryWithCount | null>(null);

  const filtered = categories.filter((c) => c.type === type);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(c: CategoryWithCount) {
    setEditing(c);
    setDialogOpen(true);
  }

  function remove(c: CategoryWithCount) {
    if (c._count.transactions > 0) {
      toast.error(`Нельзя удалить: используется в ${c._count.transactions} транзакциях`);
      return;
    }
    if (!window.confirm(`Удалить категорию «${c.name}»?`)) return;
    start(async () => {
      const res = await deleteCategory(c.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Категория удалена");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Type toggle */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {([TransactionType.EXPENSE, TransactionType.INCOME] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                type === t
                  ? t === TransactionType.INCOME
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-destructive/15 text-destructive"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === TransactionType.EXPENSE ? "Расходы" : "Доходы"}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="size-4" />
          Категория
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Нет категорий. Создайте первую.
        </p>
      ) : (
        <div className="rounded-xl border border-border">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border-b border-border px-3 py-3 last:border-0"
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: c.color ?? "#6b7280" }}
              />
              <span className="flex-1 text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c._count.transactions} транз.
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Редактировать"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                  aria-label="Удалить"
                  disabled={c._count.transactions > 0}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        defaultType={type}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"
pnpm build 2>&1 | tail -20
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/finances/components/category-dialog.tsx src/features/finances/components/categories-tab.tsx
git commit -m "feat(finances): CategoryDialog and CategoriesTab"
```

---

## Task 7: Wire Tabs into FinancesView + Update Page

**Files:**
- Modify: `src/features/finances/components/finances-view.tsx`
- Modify: `src/app/(app)/finances/page.tsx`

**Interfaces:**
- `FinancesView` receives a new prop: `categoriesWithCount: CategoryWithCount[]` (replaces old `categories: CategoryOption[]`)
- Tabs: `overview` | `analytics` | `categories`
- `OverviewTab` = existing content (accounts, budgets, transactions) extracted inline
- `AnalyticsTab` and `CategoriesTab` imported from their files

**Important:** The existing `TransactionDialog` and `BudgetsSection` use `CategoryOption[]` (the old type). `CategoryWithCount` is a superset (it has all the same fields plus `_count`), so it's compatible — just pass it through without changing those components.

- [ ] **Step 1: Update `src/app/(app)/finances/page.tsx`**

Replace the entire file:

```typescript
import type { Metadata } from "next";
import { FinancesView } from "@/features/finances/components/finances-view";
import {
  getAccountsWithBalance,
  getBudgetsWithSpend,
  getCategoriesWithCount,
  getTransactions,
} from "@/features/finances/queries";

export const metadata: Metadata = { title: "Финансы" };

export default async function FinancesPage() {
  const [accounts, transactions, categories, budgets] = await Promise.all([
    getAccountsWithBalance(),
    getTransactions(),
    getCategoriesWithCount(),
    getBudgetsWithSpend(),
  ]);

  return (
    <FinancesView
      accounts={accounts}
      transactions={transactions}
      categories={categories}
      budgets={budgets}
    />
  );
}
```

- [ ] **Step 2: Rewrite `src/features/finances/components/finances-view.tsx`**

Replace the entire file with the version below. Key changes:
1. Add `type Tab = "overview" | "analytics" | "categories"` and `useState<Tab>("overview")`
2. Render tab bar at the top
3. Render `AnalyticsTab`, `CategoriesTab`, or existing overview content based on active tab
4. Change prop type from `categories: CategoryOption[]` to `categories: CategoryWithCount[]`

```typescript
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  ArrowLeftRight,
  BarChart3,
  MoreHorizontal,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { AccountDialog } from "./account-dialog";
import { TransactionDialog } from "./transaction-dialog";
import { TransactionList } from "./transaction-list";
import { TransferDialog } from "./transfer-dialog";
import { BudgetsSection } from "./budgets-section";
import { AnalyticsTab } from "./analytics-tab";
import { CategoriesTab } from "./categories-tab";
import {
  deleteAccount,
  deleteTransaction,
  setAccountArchived,
} from "../actions";
import { ACCOUNT_TYPE_LABELS } from "../constants";
import { formatMoney } from "../money";
import type {
  AccountWithBalance,
  BudgetRow,
  CategoryWithCount,
  TransactionRow,
} from "../queries";

type Tab = "overview" | "analytics" | "categories";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Обзор", icon: Wallet },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "categories", label: "Категории", icon: Tag },
];

const ALL = "ALL";

export function FinancesView({
  accounts,
  transactions,
  categories,
  budgets,
}: {
  accounts: AccountWithBalance[];
  transactions: TransactionRow[];
  categories: CategoryWithCount[];
  budgets: BudgetRow[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [tab, setTab] = useState<Tab>("overview");
  const [accountDialog, setAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithBalance | null>(null);
  const [txDialog, setTxDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionRow | null>(null);
  const [accFilter, setAccFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);

  const activeAccounts = accounts.filter((a) => !a.archived);

  const filteredTx = useMemo(
    () =>
      transactions.filter((t) => {
        if (accFilter !== ALL && t.account.id !== accFilter) return false;
        if (typeFilter !== ALL && t.type !== typeFilter) return false;
        return true;
      }),
    [transactions, accFilter, typeFilter],
  );

  function removeAccount(a: AccountWithBalance) {
    if (
      !window.confirm(
        `Удалить счёт «${a.name}»? Все его транзакции тоже будут удалены.`,
      )
    )
      return;
    start(async () => {
      const res = await deleteAccount(a.id);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Счёт удалён");
      router.refresh();
    });
  }

  function archiveAccount(a: AccountWithBalance) {
    start(async () => {
      const res = await setAccountArchived(a.id, !a.archived);
      if ("error" in res) { toast.error(res.error); return; }
      router.refresh();
    });
  }

  function removeTx(t: TransactionRow) {
    if (!window.confirm("Удалить транзакцию?")) return;
    start(async () => {
      const res = await deleteTransaction(t.id);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Транзакция удалена");
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Финансы"
        description="Счета, баланс и история доходов и расходов."
        action={
          tab === "overview" ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setEditingAccount(null); setAccountDialog(true); }}
              >
                <Plus className="size-4" />
                Счёт
              </Button>
              <Button
                variant="outline"
                onClick={() => setTransferDialog(true)}
                disabled={activeAccounts.length < 2}
              >
                <ArrowLeftRight className="size-4" />
                Перевод
              </Button>
              <Button
                onClick={() => { setEditingTx(null); setTxDialog(true); }}
                disabled={activeAccounts.length === 0}
              >
                <Plus className="size-4" />
                Транзакция
              </Button>
            </div>
          ) : null
        }
      />

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "analytics" && <AnalyticsTab transactions={transactions} />}
      {tab === "categories" && <CategoriesTab categories={categories} />}
      {tab === "overview" && (
        <>
          {accounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Пока нет счетов"
              description="Создайте счёт, чтобы вести доходы и расходы."
            />
          ) : (
            <>
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "rounded-xl border border-border bg-card p-4",
                      a.archived && "opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {ACCOUNT_TYPE_LABELS[a.type]}
                        </p>
                        <h3 className="font-medium">{a.name}</h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="rounded-md p-1 text-muted-foreground outline-none hover:bg-accent"
                          aria-label="Действия"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => { setEditingAccount(a); setAccountDialog(true); }}
                            className="cursor-pointer"
                          >
                            <Pencil className="size-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => archiveAccount(a)}
                            className="cursor-pointer"
                          >
                            {a.archived ? (
                              <><ArchiveRestore className="size-4" />Из архива</>
                            ) : (
                              <><Archive className="size-4" />В архив</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => removeAccount(a)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="mt-4 text-2xl font-semibold tabular-nums">
                      {formatMoney(a.balance, a.currency)}
                    </p>
                  </div>
                ))}
              </div>

              <BudgetsSection budgets={budgets} categories={categories} />

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Транзакции</h2>
                <div className="flex gap-2">
                  <Select value={accFilter} onValueChange={setAccFilter}>
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Все счета</SelectItem>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Все типы</SelectItem>
                      <SelectItem value="INCOME">Доходы</SelectItem>
                      <SelectItem value="EXPENSE">Расходы</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredTx.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="Нет транзакций"
                  description="Добавьте первую транзакцию или измените фильтры."
                />
              ) : (
                <TransactionList
                  transactions={filteredTx}
                  onEdit={(t) => { setEditingTx(t); setTxDialog(true); }}
                  onDelete={removeTx}
                />
              )}
            </>
          )}
        </>
      )}

      <AccountDialog
        open={accountDialog}
        onOpenChange={setAccountDialog}
        account={editingAccount}
      />
      <TransactionDialog
        open={txDialog}
        onOpenChange={setTxDialog}
        transaction={editingTx}
        accounts={activeAccounts}
        categories={categories}
      />
      <TransferDialog
        open={transferDialog}
        onOpenChange={setTransferDialog}
        accounts={activeAccounts}
      />
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"
pnpm build 2>&1 | tail -20
```

Expected: exit 0. Fix any type errors (most likely: `CategoryWithCount` vs `CategoryOption` mismatch — `CategoryWithCount` has all fields of `CategoryOption` plus `_count`, so it should be assignable).

- [ ] **Step 4: Commit**

```bash
git add src/features/finances/components/finances-view.tsx src/app/\(app\)/finances/page.tsx
git commit -m "feat(finances): tab navigation — Обзор / Аналитика / Категории"
```

---

## Task 8: Dashboard Refresh

**Files:**
- Modify: `src/features/dashboard/queries.ts`
- Modify: `src/app/(app)/dashboard/page.tsx`

**Goal:**
1. Add `financeThisMonth: { income: number; expense: number }` to `getDashboardSummary`
2. Replace the `Долги` StatCard with `Расходы (месяц)`
3. Move debts to a new `DebtPanel` at the bottom (same Panel component as Goals/Subscriptions)
4. Add a `FinancePanel` at the bottom showing income vs expense for current month

- [ ] **Step 1: Add `financeThisMonth` to `src/features/dashboard/queries.ts`**

Add these imports at the top of the file (if not already present):
```typescript
import { startOfMonth, endOfMonth, addDays, endOfDay, format } from "date-fns";
import { TransactionType } from "@prisma/client";
```
(Note: `addDays`, `endOfDay`, `format` are already imported; add `startOfMonth`, `endOfMonth` and `TransactionType` if missing.)

In the `Promise.all` array inside `getDashboardSummary`, add a new query at the end:

```typescript
// This month income + expense totals
db.transaction.groupBy({
  by: ["type"],
  where: {
    date: { gte: startOfMonth(now), lte: endOfMonth(now) },
    category: { name: { not: "Перевод" } },
  },
  _sum: { amount: true },
}),
```

Destructure it at the top of the `Promise.all` destructuring:
```typescript
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
  monthlyTotals,   // ← new
] = await Promise.all([...]);
```

Then compute the values before the return:

```typescript
const monthIncome =
  monthlyTotals.find((r) => r.type === TransactionType.INCOME)?._sum.amount?.toNumber() ?? 0;
const monthExpense =
  monthlyTotals.find((r) => r.type === TransactionType.EXPENSE)?._sum.amount?.toNumber() ?? 0;
```

Add to the return object:
```typescript
financeThisMonth: { income: monthIncome, expense: monthExpense },
```

- [ ] **Step 2: Rewrite `src/app/(app)/dashboard/page.tsx`**

The changes to `page.tsx` are:
1. Import `TrendingDown` from lucide-react (for expenses icon)
2. Replace the `Долги` StatCard with `Расходы (месяц)` StatCard using `s.financeThisMonth.expense`
3. Add a `FinancePanel` in the bottom grid (income/expense bar comparison)
4. Add a `DebtPanel` below everything, showing the same info as the old Debts StatCard

Replace the entire file:

```typescript
import Link from "next/link";
import type { Metadata } from "next";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarClock,
  CalendarDays,
  CheckSquare,
  CreditCard,
  Flame,
  HandCoins,
  Pin,
  Target,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { PriorityDot } from "@/features/tasks/components/priority-badge";
import { formatMoney } from "@/features/finances/money";
import { MOOD_EMOJI, MOOD_LABEL } from "@/features/journal/constants";
import { getDashboardSummary } from "@/features/dashboard/queries";
import type { AgendaKind } from "@/features/agenda/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Главная" };

type Accent = "violet" | "amber" | "emerald" | "rose" | "fuchsia" | "sky";

const ACCENT: Record<
  Accent,
  { chip: string; bar: string; ring: string; barBg: string }
> = {
  violet: {
    chip: "bg-violet-500/15 text-violet-400",
    bar: "border-l-violet-500",
    ring: "hover:border-violet-500/50",
    barBg: "bg-violet-500",
  },
  amber: {
    chip: "bg-amber-500/15 text-amber-400",
    bar: "border-l-amber-500",
    ring: "hover:border-amber-500/50",
    barBg: "bg-amber-500",
  },
  emerald: {
    chip: "bg-emerald-500/15 text-emerald-400",
    bar: "border-l-emerald-500",
    ring: "hover:border-emerald-500/50",
    barBg: "bg-emerald-500",
  },
  rose: {
    chip: "bg-rose-500/15 text-rose-400",
    bar: "border-l-rose-500",
    ring: "hover:border-rose-500/50",
    barBg: "bg-rose-500",
  },
  fuchsia: {
    chip: "bg-fuchsia-500/15 text-fuchsia-400",
    bar: "border-l-fuchsia-500",
    ring: "hover:border-fuchsia-500/50",
    barBg: "bg-fuchsia-500",
  },
  sky: {
    chip: "bg-sky-500/15 text-sky-400",
    bar: "border-l-sky-500",
    ring: "hover:border-sky-500/50",
    barBg: "bg-sky-500",
  },
};

const AGENDA_ACCENT: Record<AgendaKind, Accent> = {
  task: "violet",
  goal: "fuchsia",
  debt: "rose",
  subscription: "sky",
};

const AGENDA_ICON: Record<AgendaKind, LucideIcon> = {
  task: CheckSquare,
  goal: Target,
  debt: HandCoins,
  subscription: CreditCard,
};

function greeting(hour: number): string {
  if (hour < 6) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export default async function DashboardPage() {
  const s = await getDashboardSummary();
  const now = new Date();
  const currencies = Object.entries(s.balances);
  const debtCurrencies = Object.entries(s.debts.totals);

  return (
    <>
      {/* Greeting hero */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting(now.getHours())} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">
            {format(now, "EEEE, d MMMM", { locale: ru })}
          </p>
        </div>
        {s.todayMood != null && (
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-amber-500/50"
            title={MOOD_LABEL[s.todayMood]}
          >
            <span className="text-base">{MOOD_EMOJI[s.todayMood]}</span>
            <span className="text-muted-foreground">настроение сегодня</span>
          </Link>
        )}
      </div>

      {/* Key numbers — Долги replaced with Расходы (месяц) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          href="/tasks"
          accent="violet"
          icon={CheckSquare}
          label="Задачи сегодня"
          value={String(s.tasks.due.length)}
          hint={`${s.tasks.openCount} открытых всего`}
        />
        <StatCard
          href="/habits"
          accent="amber"
          icon={Flame}
          label="Привычки"
          value={s.habits.total ? `${s.habits.doneToday}/${s.habits.total}` : "—"}
          hint="отмечено за сегодня"
        />
        <StatCard
          href="/finances"
          accent="emerald"
          icon={Wallet}
          label="Баланс"
          value={
            currencies.length
              ? formatMoney(currencies[0][1], currencies[0][0])
              : "—"
          }
          hint={
            currencies.length > 1
              ? currencies.slice(1).map(([c, v]) => formatMoney(v, c)).join(" · ")
              : "по всем счетам"
          }
        />
        <StatCard
          href="/finances"
          accent="rose"
          icon={TrendingDown}
          label="Расходы (месяц)"
          value={
            s.financeThisMonth.expense > 0
              ? formatMoney(s.financeThisMonth.expense, "KZT")
              : "—"
          }
          hint={
            s.financeThisMonth.income > 0
              ? `доходы ${formatMoney(s.financeThisMonth.income, "KZT")}`
              : "нет данных"
          }
        />
        <StatCard
          href="/goals"
          accent="fuchsia"
          icon={Target}
          label="Цели"
          value={String(s.goals.length)}
          hint="в работе"
        />
        <StatCard
          href="/subscriptions"
          accent="sky"
          icon={CreditCard}
          label="Платежи 7 дней"
          value={String(s.subscriptions.length)}
          hint="ближайшие списания"
        />
      </div>

      {/* Agenda + Tasks */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Panel
          title="Повестка"
          href="/agenda"
          icon={CalendarDays}
          accent="sky"
          className="lg:col-span-2"
        >
          {s.agenda.length === 0 ? (
            <Empty text="На ближайшие 30 дней ничего не запланировано." />
          ) : (
            <ul className="divide-y divide-border">
              {s.agenda.map((item) => {
                const Icon = AGENDA_ICON[item.kind];
                const acc = ACCENT[AGENDA_ACCENT[item.kind]];
                const overdue = differenceInCalendarDays(item.date, now) < 0;
                return (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        acc.chip,
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="flex-1 truncate text-sm">{item.title}</span>
                    {item.meta && (
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {item.meta}
                      </span>
                    )}
                    <span
                      className={cn(
                        "w-24 text-right text-xs tabular-nums",
                        overdue ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {relativeDay(item.date, now)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Задачи на сегодня" href="/tasks" icon={CheckSquare} accent="violet">
          {s.tasks.due.length === 0 ? (
            <Empty text="На сегодня ничего не запланировано." />
          ) : (
            <ul className="divide-y divide-border">
              {s.tasks.due.map((t) => {
                const overdue = differenceInCalendarDays(t.dueDate, now) < 0;
                return (
                  <li key={t.id} className="flex items-center gap-2 py-2.5">
                    <PriorityDot priority={t.priority} />
                    <span className="flex-1 truncate text-sm">{t.title}</span>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        overdue ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {format(t.dueDate, "d MMM", { locale: ru })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Goals + Subscriptions */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Цели" href="/goals" icon={Target} accent="fuchsia">
          {s.goals.length === 0 ? (
            <Empty text="Активных целей нет. Поставьте первую." />
          ) : (
            <ul className="space-y-3 pt-1">
              {s.goals.slice(0, 4).map((g) => (
                <li key={g.id}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{g.title}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {g.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-fuchsia-500"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Ближайшие платежи"
          href="/subscriptions"
          icon={CreditCard}
          accent="sky"
        >
          {s.subscriptions.length === 0 ? (
            <Empty text="Нет платежей в ближайшие 7 дней." />
          ) : (
            <ul className="divide-y divide-border">
              {s.subscriptions.map((sub) => {
                const days = differenceInCalendarDays(sub.nextPaymentDate, now);
                return (
                  <li key={sub.id} className="flex items-center gap-2 py-2.5">
                    <span className="text-lg">{sub.icon || "💳"}</span>
                    <span className="flex-1 truncate text-sm">{sub.name}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatMoney(sub.amount, sub.currency)}
                    </span>
                    <span className="inline-flex w-20 items-center justify-end gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="size-3" />
                      {days <= 0 ? "сегодня" : `${days} дн.`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Finance overview panel */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Финансы (этот месяц)" href="/finances" icon={Wallet} accent="emerald">
          {s.financeThisMonth.income === 0 && s.financeThisMonth.expense === 0 ? (
            <Empty text="Нет транзакций за этот месяц." />
          ) : (
            <div className="space-y-3 pt-1">
              <FinanceRow
                label="Доходы"
                value={s.financeThisMonth.income}
                total={Math.max(s.financeThisMonth.income, s.financeThisMonth.expense)}
                color="bg-emerald-500"
              />
              <FinanceRow
                label="Расходы"
                value={s.financeThisMonth.expense}
                total={Math.max(s.financeThisMonth.income, s.financeThisMonth.expense)}
                color="bg-destructive"
              />
              <div className="border-t border-border pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Сальдо</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      s.financeThisMonth.income - s.financeThisMonth.expense >= 0
                        ? "text-emerald-500"
                        : "text-destructive",
                    )}
                  >
                    {formatMoney(
                      s.financeThisMonth.income - s.financeThisMonth.expense,
                      "KZT",
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* Debt panel — moved from top StatCards */}
        <Panel title="Долги" href="/debts" icon={HandCoins} accent="rose">
          {debtCurrencies.length === 0 ? (
            <Empty text="Нет открытых долгов." />
          ) : (
            <div className="space-y-3 pt-1">
              {debtCurrencies.map(([currency, totals]) => (
                <div key={currency} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Мне должны</span>
                    <span className="tabular-nums text-emerald-500">
                      {formatMoney(totals.owedToMe, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Я должен</span>
                    <span className="tabular-nums text-destructive">
                      {formatMoney(totals.iOwe, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-1.5 text-sm font-medium">
                    <span>Чистый баланс</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        totals.net >= 0 ? "text-emerald-500" : "text-destructive",
                      )}
                    >
                      {formatMoney(totals.net, currency)}
                    </span>
                  </div>
                </div>
              ))}
              {s.debts.overdue > 0 && (
                <p className="text-xs font-medium text-destructive">
                  {s.debts.overdue} просрочено
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>

      {s.pinnedNotes > 0 && (
        <Link
          href="/notes"
          className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Pin className="size-4" />
          Закреплённых заметок: {s.pinnedNotes}
        </Link>
      )}
    </>
  );
}

function FinanceRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{formatMoney(value, "KZT")}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({
  href, accent, icon: Icon, label, value, hint, alert,
}: {
  href: string;
  accent: Accent;
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  alert?: boolean;
}) {
  const a = ACCENT[accent];
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl border border-border border-l-2 bg-card p-4 transition-colors",
        a.bar, a.ring,
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", a.chip)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 truncate text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-xs", alert ? "font-medium text-destructive" : "text-muted-foreground/70")}>
        {hint}
      </p>
    </Link>
  );
}

function Panel({
  title, href, icon: Icon, accent, className, children,
}: {
  title: string;
  href: string;
  icon: LucideIcon;
  accent: Accent;
  className?: string;
  children: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-medium">
          <span className={cn("flex size-6 items-center justify-center rounded-md", a.chip)}>
            <Icon className="size-3.5" />
          </span>
          {title}
        </h2>
        <Link href={href} className="text-xs text-primary hover:underline">
          Открыть
        </Link>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function relativeDay(date: Date, now: Date): string {
  if (isToday(date)) return "сегодня";
  if (isTomorrow(date)) return "завтра";
  const diff = differenceInCalendarDays(date, now);
  if (diff < 0) return format(date, "d MMM", { locale: ru });
  return `${diff} дн.`;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
export PATH="/opt/homebrew/bin:/Users/wersomd/Library/pnpm/bin:$PATH"
pnpm build 2>&1 | tail -30
```

Expected: exit 0. The most likely issue: `s.debts.totals` shape — check `computeDebtTotals` return type in `src/features/debts/summary.ts` to confirm `{ owedToMe, iOwe, net }` fields exist (they should based on the dashboard query). If the field names differ, adjust accordingly.

- [ ] **Step 4: Commit**

```bash
git add src/features/dashboard/queries.ts src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): finance panel + debt panel at bottom, expenses stat card"
```

---

## Self-Review

**Spec coverage:**
- [x] Tab navigation on /finances (Обзор | Аналитика | Категории) — Task 7
- [x] Period selector with 6 options — Task 5
- [x] Income / Expense / Net summary cards — Task 5
- [x] Donut chart (recharts) — Tasks 4 + 5
- [x] Category breakdown table with % — Task 5
- [x] Category CRUD (create, edit, delete with guard) — Tasks 2 + 6
- [x] Color picker (12 swatches + custom hex input) — Task 6
- [x] No emoji in categories — Task 6 (no icon field in dialog)
- [x] Dashboard: Debts StatCard replaced with Expenses — Task 8
- [x] Dashboard: FinancePanel at bottom — Task 8
- [x] Dashboard: DebtPanel at bottom — Task 8
- [x] "Перевод" excluded from analytics — Tasks 3 + 8

**Placeholder scan:** No TBDs. All steps have complete code.

**Type consistency:**
- `CategoryWithCount` defined in Task 2, consumed in Tasks 6, 7
- `CategoryStat` defined in Task 3, consumed in Tasks 4, 5
- `Period` defined in Task 3, consumed in Task 5
- `TransactionRow` flows from existing `queries.ts` into Tasks 3, 5
- `computeAnalytics` → `{ income, expense, byCategory: CategoryStat[] }` — consistent across Tasks 3 and 5
- `financeThisMonth: { income, expense }` — defined in Task 8 query addition, consumed in Task 8 page
