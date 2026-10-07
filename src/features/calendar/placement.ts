import { dateOnly, dayKey } from "@/lib/workspace-date";
import type { CalendarItem } from "./queries";
export function calendarDay(item: Pick<CalendarItem, "kind" | "date">, now = new Date(), includeOverdue = true): string {
  if (item.kind === "event") return dayKey(item.date);
  const key = dateOnly(item.date);
  return includeOverdue && key < dayKey(now) ? dayKey(now) : key;
}
