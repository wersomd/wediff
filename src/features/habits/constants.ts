import { HabitFrequency } from "@prisma/client";

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  DAILY: "Ежедневно",
  WEEKLY: "Еженедельно",
};

export const HABIT_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#a3a3a3",
];

export const DEFAULT_HABIT_COLOR = HABIT_COLORS[0];

// How many days the row strip shows (today + previous 6).
export const STRIP_DAYS = 7;
