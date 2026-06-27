# Phase 2 — Tasks + Projects

Status: approved 2026-06-27. Single-user Life OS (see CLAUDE.md). Goal: a Todoist/Trello-grade
task tracker plus lightweight projects, "clean in code and logic".

## Scope

In:
- **Tasks** module with two views over the same data, toggled in the header: a **Kanban board**
  (columns = `TaskStatus`) with drag-and-drop, and a **list/table** with filters.
- **Projects** module: a list of projects (with task counts + status), and a per-project detail
  page that reuses the task board/list scoped to that project.
- Inline quick-add (title only) in each board column / at the top of the list. Full create+edit
  through a dialog (description, priority, due date, project, status).
- CRUD for both tasks and projects; archive for projects.

Out (YAGNI for Phase 2): task tags (schema `Tag` is not related to `Task`), subtasks, recurring
tasks, reminders/notifications, dragging projects, multi-select bulk actions.

## Data model (already in prisma/schema.prisma)

- `Project`: name, description?, status (`ACTIVE|ON_HOLD|COMPLETED|ARCHIVED`), color?, timestamps,
  `tasks Task[]`, `notes Note[]`.
- `Task`: title, description?, status (`TODO|IN_PROGRESS|DONE|CANCELLED`),
  priority (`LOW|MEDIUM|HIGH|URGENT`), dueDate?, completedAt?, `order Int` (per-column ordering),
  projectId?, timestamps. Indexes on status, projectId, dueDate.

No schema change is expected for Phase 2.

## Architecture

Follow project conventions: reads in Server Components via `queries.ts`; writes via Server Actions
in `actions.ts` validated with Zod (`schema.ts`); `revalidatePath` after writes. Single-user, so no
`userId` on domain tables; actions still call `auth()` to gate access.

```
src/features/projects/
  schema.ts      projectCreateSchema, projectUpdateSchema
  queries.ts     getProjects() -> projects + _count.tasks; getProject(id) -> project + tasks
  actions.ts     createProject, updateProject, deleteProject, setProjectStatus
  components/     project-list.tsx, project-card.tsx, project-dialog.tsx
src/features/tasks/
  schema.ts      taskCreateSchema, taskUpdateSchema, moveTaskSchema
  queries.ts     getTasks(filter?) ; getProjectsForPicker()
  actions.ts     createTask, updateTask, deleteTask, toggleDone, moveTask
  components/     tasks-view.tsx (owns view state + data), view-switcher.tsx,
                  board.tsx, board-column.tsx, task-card.tsx,
                  task-list.tsx, task-row.tsx, quick-add.tsx,
                  task-dialog.tsx, priority-badge.tsx, task-filters.tsx
```

Pages:
- `(app)/tasks/page.tsx` — Server Component: loads all tasks + projects, renders `<TasksView>`.
- `(app)/projects/page.tsx` — Server Component: loads projects, renders `<ProjectList>`.
- `(app)/projects/[id]/page.tsx` — Server Component: loads project + its tasks, renders header +
  `<TasksView projectId=...>` (board/list reused, project pre-selected and locked).

## Behaviour & data flow

**Board ordering.** Columns are the four `TaskStatus` values. Within a column tasks are ordered by
`order` asc, then `createdAt`. Drag is handled client-side with optimistic state; on drop the client
calls `moveTask({ taskId, toStatus, toIndex })`. The server recomputes `order` for the affected
column(s) by writing sequential integers (0,1,2,…) to the tasks in their new order inside a
transaction. Moving a task **into** `DONE` sets `completedAt = now()`; moving **out of** `DONE`
clears it.

**List.** Same task set as a table: checkbox (toggles DONE via `toggleDone`, which also flips
`completedAt`), title (click → edit dialog), priority badge, due date (overdue = destructive color),
project chip. Filters: status, priority, project; client-side over the loaded set for v1.

**Create/edit.** Quick-add input creates a task with just a title (status = the column it was added
in, or TODO in the list). The edit dialog (a controlled shadcn Dialog) edits all fields; it is also
reused for "new task with full fields" from the header `+` button.

**Optimistic UX.** Board drag and list checkbox update local state immediately, then reconcile with
the server action result and `router.refresh()`. Errors surface via `sonner` toast and revert.

## Dependencies

- shadcn primitives to add: `dialog`, `select`, `textarea`, `checkbox`, `badge`.
- Drag-and-drop: **@dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`).
  Risk: React 19 freshness (project history shows fresh releases breaking the build). Mitigation:
  install and build early; if it breaks, fall back to native HTML5 drag-and-drop (zero deps). The
  list view and all CRUD are independent of DnD, so the module is usable either way.
- Due date: native `<input type="date">` (no calendar dependency) for v1.

## Testing / verification

- `pnpm build` green.
- Logic: order recompute and completedAt transitions are pure-ish and unit-testable; cover
  `moveTask` reordering and DONE/undone `completedAt` in a small test if a runner is wired,
  otherwise verify via the live flow.
- Live (browse on dev): project CRUD, open detail; task inline-add, edit dialog, delete; drag across
  columns + reorder persists after refresh; list checkbox toggles DONE; filters; view switch.

## Non-goals / future

Tags, subtasks, recurrence, reminders, calendar picker, bulk edit, project drag-ordering — later
phases or explicitly dropped.
