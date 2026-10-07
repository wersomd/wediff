import type { Metadata } from "next";
import { format, endOfDay, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { dayKey } from "@/lib/workspace-date";
import { CalendarMonthGrid } from "@/features/calendar/components/calendar-month-grid";
import { getCalendarItems } from "@/features/calendar/queries";

export const metadata: Metadata = { title: "Календарь" };

function parseMonth(param?: string): Date {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [year, month] = param.split("-").map(Number);
    if (month >= 1 && month <= 12 && year >= 1900 && year <= 9999) return new Date(year, month - 1, 1);
  }
  const now = new Date(`${dayKey()}T12:00:00`);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { month: monthParam, day } = await searchParams;
  const month = parseMonth(monthParam ?? day?.slice(0, 7));
  const from = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const to = endOfDay(endOfWeek(endOfMonth(month), { weekStartsOn: 1 }));
  const items = await getCalendarItems({ from, to });

  return <CalendarMonthGrid monthKey={format(month, "yyyy-MM")} items={items} />;
}
