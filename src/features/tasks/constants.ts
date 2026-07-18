import { TaskStatus, TaskPriority } from "@prisma/client";

// Board columns, left to right.
export const TASK_STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.ON_HOLD,
  TaskStatus.DONE,
  TaskStatus.CANCELLED,
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "План",
  IN_PROGRESS: "В работе",
  REVIEW: "Ревью",
  ON_HOLD: "На стопе",
  DONE: "Завершено",
  CANCELLED: "Отменено",
};

export const TASK_PRIORITY_ORDER: TaskPriority[] = [
  TaskPriority.URGENT,
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.LOW,
];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Срочный",
};

// Tailwind classes for the priority dot/badge per level.
export const TASK_PRIORITY_DOT: Record<TaskPriority, string> = {
  LOW: "bg-muted-foreground",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-amber-500",
  URGENT: "bg-red-500",
};

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

// Sentinel for "no filter" in the list view's selects.
export const ALL = "ALL";

export type TaskFiltersState = {
  status: string;
  priority: string;
  projectId: string;
};
