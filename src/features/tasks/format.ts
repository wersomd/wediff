import { TaskStatus } from "@prisma/client";
import { dateLabel, daysFromToday } from "@/lib/workspace-date";
import { OPEN_TASK_STATUSES } from "./constants";
export type DueInfo = { label: string; overdue: boolean; overdueDays: number };
export function formatDue(date: Date, status?: TaskStatus): DueInfo {
  const days = daysFromToday(date);
  const overdue = days < 0 && (status === undefined || OPEN_TASK_STATUSES.includes(status));
  const label = days === 0 ? "Сегодня" : days === 1 ? "Завтра" : days === -1 ? "Вчера" : dateLabel(date);
  return { label, overdue, overdueDays: overdue ? -days : 0 };
}
export function overdueLabel(days: number): string { return `просрочено на ${days} дн.`; }
