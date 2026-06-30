# Dashboard ↔ landing parity — design

**Date:** 2026-06-30
**Status:** Approved

## Problem

The landing preview mockup (`src/app/landing-client.tsx`, `DashboardMockup`) shows a
nicer dashboard than the real one: big circular task checkboxes and a per-habit
progress panel. The real dashboard (`src/app/(app)/dashboard/page.tsx`) uses a tiny
priority dot for tasks and exposes habits only as a single stat number — no panel.

## Goal

Bring the two standout landing elements into the real dashboard **without dropping**
existing panels (Повестка, Цели, Платежи, Финансы, Долги):

1. **Big clickable task checkboxes** in "Задачи на сегодня".
2. **Per-habit weekly-progress panel** ("Привычки", X/7 bars).

## Decisions

- Approach: augment the existing rich dashboard (not a full landing-layout rewrite).
- Checkboxes are interactive — click toggles the task done via existing `toggleDone`.
- Habit bar = completions in the current week (Mon–Sun) over 7, via existing
  `weekCount()` helper in `src/features/habits/dates.ts`.
- Finance bar-chart from the mockup is **out of scope** (current income/expense bars stay).

## Changes

### 1. Query — `src/features/dashboard/queries.ts`
- Widen the `db.habit.findMany` include: fetch this-week entries (from
  `startOfWeek(now, { weekStartsOn: 1 })`) instead of only today's, selecting `date`.
- Add `habits.list`: up to 6 active habits as
  `{ id, name, color, icon, weekDone, target }`, where `weekDone = weekCount(set)`.
- Keep `habits.doneToday` / `habits.total` (derive `doneToday` from today's key).

### 2. New client component — `src/features/dashboard/components/dashboard-tasks.tsx`
- Props: `tasks: { id, title, dueDate, priority }[]`.
- Big round checkbox (`size-5`, `border-2`), ring tinted by priority (`TASK_PRIORITY_DOT`).
- Click → `toggleDone(id, true)` inside `useTransition`; optimistically mark the row
  done (check icon, strikethrough, dim), then `router.refresh()`.
- Right side keeps the due-date label; overdue in destructive color.
- Empty state preserved.

### 3. Page — `src/app/(app)/dashboard/page.tsx`
- Replace the inline tasks `<ul>` with `<DashboardTasks tasks={s.tasks.due} />`.
- Add a "Привычки" `Panel` (amber accent) rendering per-habit rows: icon + name,
  weekly bar in habit color (fallback `DEFAULT_HABIT_COLOR`), `X/7` label.
- Layout rows: (1) stat cards, (2) Повестка[2col] + Задачи, (3) Привычки + Цели,
  (4) Платежи + Финансы, (5) Долги.

## Out of scope
- Finance bar chart, stat-card count changes, any schema migration.
