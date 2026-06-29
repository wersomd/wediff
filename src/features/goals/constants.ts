import { GoalStatus } from "@prisma/client";

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  ACTIVE: "Активна",
  DONE: "Достигнута",
  ARCHIVED: "В архиве",
};
