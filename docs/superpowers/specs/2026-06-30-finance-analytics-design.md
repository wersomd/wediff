# Finance Analytics, Category Management & Dashboard Refresh

**Date:** 2026-06-30  
**Status:** Approved

## Goal

Add meaningful spending analytics with a donut chart, a proper category management UI with custom colors, and refresh the dashboard to surface finance insights and push debts to the bottom.

## Scope

1. Tabs on `/finances` — Обзор | Аналитика | Категории
2. Analytics tab — period selector, income/expense summary, donut chart, category breakdown table
3. Categories tab — CRUD with color picker (no emoji), counts
4. Dashboard — mini finance panel at bottom, debts StatCard moved to bottom row
5. Install `recharts` for the donut chart

## Out of Scope

- Multi-currency analytics normalization (amounts summed as-is, single-currency MVP)
- Forecasting, trends, bar charts over time (future phase)
- Category icon support (icon field exists in DB, not used)

---

## Architecture

### Tab navigation

Add a client-side tab switcher at the top of `FinancesView`. Three tabs: `overview` | `analytics` | `categories`. The URL does not change (state lives in component state). All data is fetched server-side and passed down; the tabs simply toggle which section renders.

### Analytics tab

**New query** `getAnalytics(period)` in `queries.ts`:
- Accepts `period: 'month' | 'last_month' | '3m' | '6m' | 'year' | 'all'`
- Returns: `{ income: number, expense: number, byCategory: { id, name, color, amount }[] }`
- Filters `Transaction` by `date` range derived from period, excludes the `Перевод` category

Since all data is already fetched on the server and passed to the client, analytics are computed client-side from the existing `transactions` array (already fetched, max 500). No extra DB call needed for MVP.

**Components:**
- `AnalyticsTab` — orchestrates period selector + summary + chart + table
- `DonutChart` — thin recharts `PieChart` wrapper (client component, `"use client"`)
- `CategoryTable` — sorted list of categories with amount + %

### Categories tab

**New actions** in `actions.ts`:
- `createCategory(input)` — validates name + type + color, creates row
- `updateCategory(input)` — name + color (type is immutable after creation)
- `deleteCategory(id)` — only allowed if no transactions reference it; returns error otherwise

**New query** `getCategoriesWithCount()` in `queries.ts` — adds `_count: { transactions: true }` to the existing `getCategories` query.

**Components:**
- `CategoriesTab` — type switcher (EXPENSE | INCOME) + list + add button
- `CategoryDialog` — name input + color palette (12 preset hex swatches + custom hex input)

**Color palette** (12 swatches, no emoji):
`#ef4444 #f97316 #eab308 #22c55e #10b981 #06b6d4 #3b82f6 #8b5cf6 #ec4899 #64748b #a16207 #0f172a`

### Dashboard changes

- **Replace** the `Долги` StatCard in the top 6-card grid with an `Расходы (месяц)` card — current month total expenses. Grid stays 6 cards.
- **Add** at bottom: a `FinancePanel` showing current month income vs expense + mini donut (top 4 categories)
- **Add** at bottom: `DebtPanel` (moves the existing debts content from StatCard to a full panel, same style as Goals/Subscriptions panels)
- Dashboard query `getDashboardSummary` gets a new `financeThisMonth` field: `{ income, expense, topCategories }`

---

## Data Flow

```
FinancesPage (server)
  └─ fetches: accounts, transactions (500), categories, budgets
        └─ passes all to FinancesView (client)
              ├─ OverviewTab   — existing content unchanged
              ├─ AnalyticsTab  — filters transactions in-memory by period
              └─ CategoriesTab — new server actions for CRUD
```

---

## Files Changed / Created

| File | Change |
|------|--------|
| `package.json` + lockfile | add `recharts` |
| `src/features/finances/queries.ts` | add `getCategoriesWithCount` |
| `src/features/finances/actions.ts` | add `createCategory`, `updateCategory`, `deleteCategory` |
| `src/features/finances/schema.ts` | add category schemas |
| `src/features/finances/components/finances-view.tsx` | add tab navigation |
| `src/features/finances/components/analytics-tab.tsx` | new |
| `src/features/finances/components/donut-chart.tsx` | new (recharts wrapper) |
| `src/features/finances/components/categories-tab.tsx` | new |
| `src/features/finances/components/category-dialog.tsx` | new |
| `src/features/dashboard/queries.ts` | add `financeThisMonth` |
| `src/app/(app)/dashboard/page.tsx` | move debts to bottom, add FinancePanel + DebtPanel |
| `src/app/(app)/finances/page.tsx` | pass `categoriesWithCount` |
