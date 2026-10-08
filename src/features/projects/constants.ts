import { ProjectStatus } from "@prisma/client";
import type { DeadlineTone } from "./progress";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Планирование",
  IN_PROGRESS: "В работе",
  REVIEW: "Проверка",
  ON_HOLD: "На паузе",
  DONE: "Готово",
  ARCHIVED: "В архиве",
};

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  ProjectStatus.PLANNING,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.REVIEW,
  ProjectStatus.ON_HOLD,
  ProjectStatus.DONE,
  ProjectStatus.ARCHIVED,
];

// Stage badge accent — same "chip" formula as the Dashboard's ACCENT map
// (bg-<color>-500/15 text-<color>-400), applied over Badge's `secondary`
// variant via tailwind-merge.
export const PROJECT_STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  PLANNING: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  REVIEW: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ON_HOLD: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  DONE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  ARCHIVED: "bg-neutral-500/15 text-neutral-600 dark:text-neutral-300",
};

export const DEADLINE_TONE_CLASS: Record<DeadlineTone, string> = {
  overdue: "text-destructive",
  soon: "text-amber-700 dark:text-amber-300",
  normal: "text-muted-foreground",
  none: "text-muted-foreground/70",
};

// A small palette so projects get a consistent accent without a color wheel.
export const PROJECT_COLORS = [
  "#2E5CFF", // signal blue (default accent)
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
  "#a3a3a3", // neutral
];

export const DEFAULT_PROJECT_COLOR = PROJECT_COLORS[0];
