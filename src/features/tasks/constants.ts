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

// Sentinel for "no filter" in the list view's selects.
export const ALL = "ALL";

export type TaskFiltersState = {
  status: string;
  priority: string;
  projectId: string;
};
