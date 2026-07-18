# Kanban board visual redesign

Status: approved 2026-07-18. Single-user Life OS (see CLAUDE.md). Goal: the task board's drag-drop
functionality was just fixed (see git history); this pass addresses the visual/interaction feel —
described by the user as "looks cheap overall". Pure re-skin, no new functionality.

## Scope

In:
- Status-driven color accents on board columns and priority indicators, reusing colors already
  established elsewhere in the app (no new palette).
- Card visual redesign: typographic hierarchy, priority-as-edge-stripe, elevation on hover.
- Column visual redesign: subtle status-tinted background, refined header treatment.
- Motion layer via `framer-motion` (already a dependency, used on the landing page): drag physics,
  reorder animation, card enter animation, drop-zone highlight, live cross-column drag preview.

Out (YAGNI for this pass): column collapse/WIP limits, quick actions on card hover, card density
toggle, any change to `TaskStatus`/`TaskPriority` schema, any change to `moveTask`/`createTask`
server actions. Task filters on the board view are a separate, already-scoped follow-up.

## Color system

Reuse existing semantic tokens from `globals.css` / already-used Tailwind colors — no new hex
values introduced:

| Status | Color | Precedent |
|---|---|---|
| TODO ("План") | `muted-foreground` (neutral) | default text tone |
| IN_PROGRESS ("В работе") | `primary` (electric violet) | brand accent — active work earns it |
| REVIEW ("Ревью") | `amber-500` | already `TASK_PRIORITY_DOT.HIGH` |
| ON_HOLD ("На стопе") | `sky-400` | new but desaturated, status-only use — cool "paused" tone, kept distinct from REVIEW's `amber-500` |
| DONE ("Завершено") | `emerald-500` | already used for "paid" in Debts |
| CANCELLED ("Отменено") | `muted-foreground`, extra-dimmed | matches existing `finished` dimming |

Applied as: a 2px colored top border on each `BoardColumn`, a small dot next to the column title,
and reused as the priority edge-stripe on `TaskCard` (via a new `TASK_PRIORITY_STRIPE` map in
`constants.ts`, parallel to the existing `TASK_PRIORITY_DOT`).

A `STATUS_ACCENT` map (color token per `TaskStatus`) is added to `constants.ts` alongside
`TASK_STATUS_LABELS`, so components consume the mapping rather than hardcoding Tailwind classes.

## Card redesign (`task-card.tsx`)

- Priority indicator moves from a small dot to a 2-3px left-edge stripe using `TASK_PRIORITY_STRIPE`
  colors (same palette as today's `TASK_PRIORITY_DOT`, just applied differently).
- Title gets slightly heavier weight; due-date/project meta row stays visually secondary
  (smaller, `text-muted-foreground`) but with tighter, more deliberate spacing.
- Hover state: subtle lift (`translate-y-[-1px]`) + stronger shadow, transition handled by
  `framer-motion`'s `whileHover` instead of the current plain CSS `transition-colors`.
- Card background keeps `bg-card` (no glass/gradient — keeps scope tight and avoids fighting
  dark-mode contrast); depth comes from shadow/elevation, not gradients.

## Column redesign (`board-column.tsx`)

- 2px top border in the column's `STATUS_ACCENT` color; header keeps existing layout (title +
  count) but the count becomes a small pill background instead of bare text.
- Column body background stays `bg-muted/40` at rest (no per-column background tinting — tested
  against the "one accent, colors are for status meaning not decoration" principle); the accent
  lives in the top border + header dot + drop-zone glow only, so six columns side-by-side don't
  turn into a rainbow.
- Drop-zone highlight (`isOver`): replace the flat `bg-accent/40` swap with a `framer-motion`
  animated glow in the *target* column's status color (fades in/out, ~150ms).

## Motion layer (`board.tsx`, `board-column.tsx`, `task-card.tsx`)

- Replace dnd-kit's default CSS `transition` string on `TaskCard` with `framer-motion`'s `layout`
  animation (via `motion.div` wrapping the sortable node) so reordering neighbors animate smoothly.
- `AnimatePresence` + fade/scale-in (~150ms) when a card is newly added to a column.
- `DragOverlay` content gets a slight scale-up (1.03) and stronger shadow while dragging, via
  `motion.div`, for a "lifted" feel — no rotation (keep it restrained per the "subtle, fast" motion
  preference).
- Add an `onDragOver` handler to `Board` that moves the active card into the hovered column's local
  state immediately (mirroring the existing `handleDragEnd` logic, applied live). This makes the
  card visually track the pointer across columns during the drag instead of only jumping at drop —
  both a polish item and a side benefit of keeping the dragged card's DOM position in the column the
  user is actually hovering, rather than parked in its origin column for the whole gesture.
- All transitions target ~150-200ms, ease-out — restrained per user preference, not "bouncy" spring
  overshoot.

## Technical notes

Files touched: `src/features/tasks/components/board.tsx`, `board-column.tsx`, `task-card.tsx`,
`priority-badge.tsx`, `src/features/tasks/constants.ts`. No server action, schema, or Prisma changes.
`framer-motion` is already in `package.json` (used today only in `src/app/landing-client.tsx`), so
no new dependency.

## Testing

Manual verification in the browser (drag between all six columns, add/remove cards, hover states,
light/dark mode) since this is a pure visual/interaction layer with no server-side logic to unit
test. `pnpm lint` + `tsc --noEmit` must stay clean.
