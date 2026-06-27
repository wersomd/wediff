import { ProjectStatus } from "@prisma/client";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Активен",
  ON_HOLD: "На паузе",
  COMPLETED: "Завершён",
  ARCHIVED: "В архиве",
};

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  ProjectStatus.ACTIVE,
  ProjectStatus.ON_HOLD,
  ProjectStatus.COMPLETED,
  ProjectStatus.ARCHIVED,
];

// A small palette so projects get a consistent accent without a color wheel.
export const PROJECT_COLORS = [
  "#8b5cf6", // violet (default accent)
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
  "#a3a3a3", // neutral
];

export const DEFAULT_PROJECT_COLOR = PROJECT_COLORS[0];
