import { startOfDay, subDays } from "date-fns";
import { daysFromToday } from "@/lib/workspace-date";
import { ALL, OPEN_TASK_STATUSES, TASK_PRIORITY_ORDER, type TaskFiltersState, type TaskSort } from "./constants";
import type { TaskWithProject } from "./queries";

// Due-date bucket check for the "due" filter select.
export function matchesDue(
  task: TaskWithProject,
  due: string,
  now: Date,
): boolean {
  if (due === ALL) return true;
  if (due === "NONE") return task.dueDate === null;
  if (!task.dueDate) return false;
  const days = daysFromToday(task.dueDate, now);
  if (due === "OVERDUE") return days < 0;
  if (due === "TODAY") return days === 0;
  if (due === "WEEK") return days >= 0 && days < 7;
  return true;
}

// Created-date bucket check for the "created" filter select.
export function matchesCreated(
  task: TaskWithProject,
  created: string,
  now: Date,
): boolean {
  if (created === ALL) return true;
  const since =
    created === "TODAY"
      ? startOfDay(now)
      : created === "WEEK"
        ? subDays(now, 7)
        : subDays(now, 30); // "MONTH"
  return task.createdAt.getTime() >= since.getTime();
}

// All active-filter predicates in one pass. `now` is threaded through so a
// single timestamp is shared across every task comparison.
export function matchesFilters(
  task: TaskWithProject,
  filters: TaskFiltersState,
  now: Date,
): boolean {
  if (filters.query?.trim() && !task.title.toLocaleLowerCase("ru").includes(filters.query.trim().toLocaleLowerCase("ru"))) return false;
  if (filters.status === "OPEN") {
    if (!OPEN_TASK_STATUSES.includes(task.status)) return false;
  } else if (filters.status !== ALL && task.status !== filters.status) return false;
  if (filters.priority !== ALL && task.priority !== filters.priority)
    return false;
  if (filters.projectId !== ALL && (task.projectId ?? "") !== filters.projectId)
    return false;
  if (!matchesDue(task, filters.due, now)) return false;
  if (!matchesCreated(task, filters.created, now)) return false;
  return true;
}

const PRIORITY_RANK = new Map(
  TASK_PRIORITY_ORDER.map((p, i) => [p, i]),
); // URGENT = 0 … LOW = 3

// Comparators for every non-manual sort. "manual" keeps the incoming order
// (already sorted by the stored `order` field) so it is not listed here.
const COMPARATORS: Record<
  Exclude<TaskSort, "manual">,
  (a: TaskWithProject, b: TaskWithProject) => number
> = {
  priority: (a, b) =>
    (PRIORITY_RANK.get(a.priority) ?? 99) - (PRIORITY_RANK.get(b.priority) ?? 99),
  // Soonest due first; tasks with no due date sink to the bottom.
  due: (a, b) => {
    const av = a.dueDate?.getTime() ?? Infinity;
    const bv = b.dueDate?.getTime() ?? Infinity;
    return av - bv;
  },
  created: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(), // newest first
  title: (a, b) => a.title.localeCompare(b.title, "ru"),
};

// Non-mutating sort. Returns the input as-is for "manual".
export function sortTasks(
  tasks: TaskWithProject[],
  sort: TaskSort,
): TaskWithProject[] {
  if (sort === "manual") return tasks;
  return [...tasks].sort(COMPARATORS[sort]);
}

// Filter + sort in one call, for both the board (per column) and the list.
export function applyTaskView(
  tasks: TaskWithProject[],
  filters: TaskFiltersState,
  sort: TaskSort,
  now: Date = new Date(),
): TaskWithProject[] {
  return sortTasks(
    tasks.filter((t) => matchesFilters(t, filters, now)),
    sort,
  );
}
