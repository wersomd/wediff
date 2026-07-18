# Kanban Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the existing task Kanban board (`src/features/tasks/components/board.tsx` and
friends) with status-driven color accents, a refined card layout, and restrained motion — no
functional or schema changes.

**Architecture:** Pure UI-layer changes on top of the already-working board/dnd-kit structure. Color
constants live in `constants.ts` and are consumed by `TaskCard`/`BoardColumn`. Motion is split
between two mechanisms picked for lowest integration risk: dnd-kit's own `transition` option on
`useSortable` (tuned for a faster/eased reorder animation — avoids known conflicts between
dnd-kit's transform-based drag positioning and framer-motion's `layout` FLIP animation on the same
node) and `framer-motion`'s `whileHover`/mount-`animate` on a nested wrapper inside each card (for
hover lift and enter animation — isolated from dnd-kit's own transform so the two systems never
fight over the same CSS property on the same element). `board.tsx` gains an `onDragOver` handler so
the dragged card visually relocates into the hovered column mid-drag instead of only at drop.

**Tech Stack:** Next.js 15 / React 19 / TypeScript, Tailwind v4, `@dnd-kit/core` + `@dnd-kit/sortable`
(already used), `framer-motion` (already a dependency — used today only on the landing page).

## Global Constraints

- No changes to `TaskStatus`/`TaskPriority` schema, Prisma, server actions, or Zod schemas — this is
  a visual/interaction layer only (per spec `docs/superpowers/specs/2026-07-18-kanban-visual-redesign-design.md`).
- No new npm dependency — `framer-motion` is already in `package.json`.
- Colors reuse existing semantic tokens/Tailwind palette entries already used elsewhere in the app
  (`primary`, `amber-500`, `emerald-500`, `muted-foreground`) plus one new but desaturated
  status-only tone (`sky-400` for ON_HOLD) — no new hex values.
- Motion timing: ~150ms, ease-out, restrained — not springy/bouncy (explicit user preference).
- `pnpm lint` and `npx tsc --noEmit` must stay clean after every task.
- Deviation from spec (discovered during planning, documented here for transparency): the spec's
  "replace dnd-kit's CSS transition with framer-motion's `layout` animation" is implemented instead
  via dnd-kit's own `transition` option (`{ duration: 150, easing: "ease-out" }` passed to
  `useSortable`). Same user-visible outcome (smooth ~150ms eased reorder), lower integration risk —
  framer-motion's `layout` FLIP animation and dnd-kit's transform-based drag positioning both want
  to own the same element's `transform`, which is a documented source of visual glitches when
  combined. `framer-motion` is still used, just scoped to hover/mount animation on a nested element
  instead of layout reflow.

---

### Task 1: Status and priority color constants

**Files:**
- Modify: `src/features/tasks/constants.ts`

**Interfaces:**
- Produces: `STATUS_ACCENT: Record<TaskStatus, { border: string; dot: string; glow: string }>`,
  `TASK_PRIORITY_STRIPE: Record<TaskPriority, string>` — consumed by Task 2 (`TaskCard`) and
  Task 3 (`BoardColumn`).

- [ ] **Step 1: Add the two new constants**

Append to `src/features/tasks/constants.ts`, directly after the existing `TASK_PRIORITY_DOT` export
(after line 42, before the `// Sentinel for "no filter"...` comment):

```ts
// Tailwind classes for the priority edge-stripe on kanban cards (parallel
// palette to TASK_PRIORITY_DOT, applied as a left border instead of a dot).
export const TASK_PRIORITY_STRIPE: Record<TaskPriority, string> = {
  LOW: "border-l-muted-foreground",
  MEDIUM: "border-l-blue-500",
  HIGH: "border-l-amber-500",
  URGENT: "border-l-red-500",
};

// Per-status color accent for the kanban board: a top border + header dot on
// the column, and a background tint for the drop-zone highlight. Reuses
// colors already established elsewhere (amber = priority HIGH, emerald =
// Debts "paid") rather than introducing a new palette.
export const STATUS_ACCENT: Record<
  TaskStatus,
  { border: string; dot: string; glow: string }
> = {
  TODO: {
    border: "border-t-muted-foreground/50",
    dot: "bg-muted-foreground/70",
    glow: "bg-muted-foreground/10",
  },
  IN_PROGRESS: {
    border: "border-t-primary",
    dot: "bg-primary",
    glow: "bg-primary/10",
  },
  REVIEW: {
    border: "border-t-amber-500",
    dot: "bg-amber-500",
    glow: "bg-amber-500/10",
  },
  ON_HOLD: {
    border: "border-t-sky-400",
    dot: "bg-sky-400",
    glow: "bg-sky-400/10",
  },
  DONE: {
    border: "border-t-emerald-500",
    dot: "bg-emerald-500",
    glow: "bg-emerald-500/10",
  },
  CANCELLED: {
    border: "border-t-muted-foreground/30",
    dot: "bg-muted-foreground/40",
    glow: "bg-muted-foreground/10",
  },
};
```

- [ ] **Step 2: Verify — typecheck**

Run: `npx tsc --noEmit`
Expected: no output (no errors). These are additive exports; nothing consumes them yet, so no
other file changes at this point.

- [ ] **Step 3: Commit**

```bash
git add src/features/tasks/constants.ts
git commit -m "feat(tasks): add status/priority color constants for kanban redesign"
```

---

### Task 2: TaskCard visual redesign

**Files:**
- Modify: `src/features/tasks/components/task-card.tsx`

**Interfaces:**
- Consumes: `TASK_PRIORITY_STRIPE` from Task 1 (`src/features/tasks/constants.ts`).
- Produces: `TaskCard` keeps its existing exported signature
  `{ task: TaskWithProject; onClick?: () => void; overlay?: boolean }` — no change to how
  `board-column.tsx` or `board.tsx` invoke it.

- [ ] **Step 1: Replace the file contents**

Replace the full contents of `src/features/tasks/components/task-card.tsx` with:

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Ban, CalendarClock, CheckCircle2 } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_STRIPE } from "../constants";
import { formatDue } from "../format";
import type { TaskWithProject } from "../queries";

export function TaskCard({
  task,
  onClick,
  overlay = false,
}: {
  task: TaskWithProject;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { status: task.status },
    transition: { duration: 150, easing: "ease-out" },
  });

  const done = task.status === TaskStatus.DONE;
  const cancelled = task.status === TaskStatus.CANCELLED;
  const finished = done || cancelled;
  const due = task.dueDate ? formatDue(task.dueDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "group cursor-grab touch-none rounded-lg border border-l-[3px] border-border bg-card p-3 text-left shadow-sm transition-shadow duration-150 hover:shadow-md active:cursor-grabbing",
          TASK_PRIORITY_STRIPE[task.priority],
          isDragging && "opacity-40",
          finished && "bg-muted/30",
          overlay && "scale-[1.03] cursor-grabbing shadow-lg ring-1 ring-border",
        )}
      >
        <div className="flex items-start gap-2">
          {done ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          ) : cancelled ? (
            <Ban className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          ) : null}
          <p
            className={cn(
              "flex-1 text-sm font-medium leading-snug",
              finished && "font-normal text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
        </div>
        {(due || task.project) && (
          <div
            className={cn(
              "mt-2 flex flex-wrap items-center gap-2",
              finished && "pl-6",
            )}
          >
            {due && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  due.overdue && !finished
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                <CalendarClock className="size-3" />
                {due.label}
              </span>
            )}
            {task.project && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: task.project.color ?? "#8b5cf6" }}
                />
                {task.project.name}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

Notes on what changed vs. the previous version: the outer `div` still owns dnd-kit's
`ref`/`style`/`attributes`/`listeners`/`onClick` exactly as before (drag mechanics untouched); all
visual styling moved to a nested `motion.div` so framer-motion's hover/mount animation never
touches the same `transform` dnd-kit is animating. The priority dot (`PriorityDot`) is removed from
this component (kanban card now shows priority via the left-edge stripe instead); `PriorityDot`
itself is untouched and stays in use in `task-row.tsx` (list view), so do not delete
`priority-badge.tsx` or `TASK_PRIORITY_DOT`.

- [ ] **Step 2: Verify — typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no output (no errors).

Run: `pnpm lint`
Expected: exits 0, no warnings (in particular, no "unused import" for the now-removed
`PriorityDot` import — it must be gone from this file).

- [ ] **Step 3: Commit**

```bash
git add src/features/tasks/components/task-card.tsx
git commit -m "feat(tasks): redesign kanban card — priority stripe, elevation, motion"
```

---

### Task 3: BoardColumn visual redesign

**Files:**
- Modify: `src/features/tasks/components/board-column.tsx`

**Interfaces:**
- Consumes: `STATUS_ACCENT` from Task 1 (`src/features/tasks/constants.ts`).
- Produces: `BoardColumn` keeps its existing exported signature — no change to how `board.tsx`
  invokes it.

- [ ] **Step 1: Replace the file contents**

Replace the full contents of `src/features/tasks/components/board-column.tsx` with:

```tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import { QuickAdd } from "./quick-add";
import { STATUS_ACCENT, TASK_STATUS_LABELS } from "../constants";
import type { TaskWithProject } from "../queries";

export function BoardColumn({
  status,
  tasks,
  onAddTask,
  onCardClick,
}: {
  status: TaskStatus;
  tasks: TaskWithProject[];
  onAddTask: (title: string, status: TaskStatus) => void;
  onCardClick: (task: TaskWithProject) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${status}`,
    data: { status, columnId: status },
  });
  const accent = STATUS_ACCENT[status];

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border-t-2 bg-muted/40",
        accent.border,
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", accent.dot)} />
          <h3 className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</h3>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-2 flex-1 flex-col gap-2 px-2 pb-2 transition-colors duration-150",
          isOver && ["rounded-lg", accent.glow],
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="px-2 pb-2">
        <QuickAdd
          onAdd={(title) => onAddTask(title, status)}
          placeholder="Добавить задачу"
        />
      </div>
    </div>
  );
}
```

What changed vs. the previous version: added the `accent.border` top border on the column
container, added the small `accent.dot` next to the column title, and swapped the generic
`bg-accent/40` drop-zone highlight for the status-specific `accent.glow` (the count pill next to
the title was already a pill in the existing code — no change needed there).

- [ ] **Step 2: Verify — typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no output (no errors).

Run: `pnpm lint`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/tasks/components/board-column.tsx
git commit -m "feat(tasks): add status color accent to kanban columns"
```

---

### Task 4: Live cross-column drag preview

**Files:**
- Modify: `src/features/tasks/components/board.tsx`

**Interfaces:**
- Consumes: existing `Columns` type, `onColumnsChange: (next: Columns) => void` prop (both already
  defined in this file) — no new props needed.
- Produces: no new exports; `Board`'s existing signature is unchanged.

- [ ] **Step 1: Add the `DragOverEvent` import**

In `src/features/tasks/components/board.tsx`, change the `@dnd-kit/core` import block from:

```tsx
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
```

to:

```tsx
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
```

- [ ] **Step 2: Add the `handleDragOver` function**

Add this function directly after `handleDragStart` and before `handleDragEnd` (both already exist
in this file):

```tsx
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceCol = columnOf(activeId);
    const targetCol = columnOf(overId);
    if (!sourceCol || !targetCol || sourceCol === targetCol) return;

    // Live-move the dragged card into the hovered column so it visually
    // tracks the pointer during the drag; handleDragEnd still finalizes the
    // exact order and persists the move on drop.
    const moved = columns[sourceCol].find((t) => t.id === activeId);
    if (!moved) return;

    const sourceItems = columns[sourceCol].filter((t) => t.id !== activeId);
    const targetItems = [
      ...columns[targetCol],
      { ...moved, status: targetCol },
    ];

    onColumnsChange({
      ...columns,
      [sourceCol]: sourceItems,
      [targetCol]: targetItems,
    });
  }
```

- [ ] **Step 3: Wire it into `DndContext`**

Change:

```tsx
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
```

to:

```tsx
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
```

- [ ] **Step 4: Verify — typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no output (no errors).

Run: `pnpm lint`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/tasks/components/board.tsx
git commit -m "feat(tasks): live-move dragged card across columns during drag"
```

---

### Task 5: Manual verification pass

**Files:** none (verification only).

- [ ] **Step 1: Ensure the local Docker Postgres is up (not production)**

Run: `docker compose ps` from the repo root.
Expected: `wediff-db` container listed as healthy on port 5434. If not running:
`pnpm db:up`.

- [ ] **Step 2: Point the dev server at the local DB for this session**

```bash
export DATABASE_URL="postgresql://wediff:wediff@localhost:5434/wediff"
export DIRECT_URL="postgresql://wediff:wediff@localhost:5434/wediff"
pnpm dev
```

Expected: server starts on `http://localhost:3000` with no errors in the terminal.

- [ ] **Step 3: Browse the board**

Use the `/browse` skill to open `http://localhost:3000/tasks` (board view) and walk through:
- Each of the six columns shows its distinct top-border/dot color (TODO=neutral,
  IN_PROGRESS=violet, REVIEW=amber, ON_HOLD=sky, DONE=emerald, CANCELLED=dim neutral).
- Cards show a left-edge priority stripe in the right color for LOW/MEDIUM/HIGH/URGENT.
- Hovering a card lifts it slightly with a stronger shadow.
- Dragging a card between columns: the card visually moves into the hovered column mid-drag (not
  just at drop), the drop-zone glows in the target column's status color, and dropping commits the
  move (status actually changes — confirm via the count badges).
- Reordering cards within a single column: dropping mid-list animates the other cards sliding to
  make room, at roughly the ~150ms eased pace configured in Task 2 (not an instant snap).
- Toggle dark/light mode (if reachable in this build) and re-check the same points — colors must
  stay legible in both.

- [ ] **Step 4: Final typecheck + lint on the full task feature**

Run: `npx tsc --noEmit && pnpm lint`
Expected: both clean.

- [ ] **Step 5: Stop the local dev server**

Press `Ctrl+C` in the terminal running `pnpm dev`. No commit for this task (verification only).
