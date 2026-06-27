import { isToday, isTomorrow, isYesterday, isThisYear, format } from "date-fns";
import { ru } from "date-fns/locale";

// Human due-date label + whether it is overdue (past, and not done).
export function formatDue(date: Date): { label: string; overdue: boolean } {
  const now = new Date();
  const overdue = date.getTime() < startOfDay(now).getTime();
  let label: string;
  if (isToday(date)) label = "Сегодня";
  else if (isTomorrow(date)) label = "Завтра";
  else if (isYesterday(date)) label = "Вчера";
  else if (isThisYear(date)) label = format(date, "d MMM", { locale: ru });
  else label = format(date, "d MMM yyyy", { locale: ru });
  return { label, overdue };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
