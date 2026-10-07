"use client";

import { useEffect, useState } from "react";
import { useWorkspaceIntent } from "@/components/shared/use-workspace-intent";
import { dayKey } from "@/lib/workspace-date";
import { calendarDay } from "../placement";
import { PageHeader } from "@/components/shared/page-header";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarDayCell } from "./calendar-day-cell";
import { CalendarDayDialog } from "./calendar-day-dialog";
import type { CalendarItem } from "../queries";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CalendarMonthGrid({
  monthKey,
  items,
}: {
  monthKey: string;
  items: CalendarItem[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const month = new Date(`${monthKey}-01T12:00:00`);
  const [adding, setAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useWorkspaceIntent({ onCreate: () => { setSelectedDate(new Date(`${dayKey()}T12:00:00`)); setAdding(true); } });
  useEffect(() => {
    const day = params.get("day");
    if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
      const date = new Date(`${day}T12:00:00`);
      if (!Number.isNaN(date.getTime())) { setSelectedDate(date); setAdding(false); }
      const url = new URL(window.location.href);
      url.searchParams.delete("day");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  }, [params]);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function itemsForDay(day: Date) {
    return items.filter((item) => calendarDay(item, new Date(), format(gridStart, "yyyy-MM-dd") <= dayKey() && dayKey() <= format(gridEnd, "yyyy-MM-dd")) === format(day, "yyyy-MM-dd"));
  }

  function goToMonth(next: Date) {
    router.push(`/calendar?month=${format(next, "yyyy-MM")}`);
  }

  return (
    <>
      <PageHeader title="Календарь" description="Встречи, дедлайны и платежи в одном расписании." action={<Button onClick={() => { setSelectedDate(new Date(`${dayKey()}T12:00:00`)); setAdding(true); }}><Plus className="size-4" />Событие</Button>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold capitalize tracking-tight">
          {format(month, "LLLL yyyy", { locale: ru })}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Предыдущий месяц" onClick={() => goToMonth(subMonths(month, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToMonth(new Date(`${dayKey()}T12:00:00`))}>
            Сегодня
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Следующий месяц" onClick={() => goToMonth(addMonths(month, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-card px-2 py-2 text-center font-medium">
            {d}
          </div>
        ))}
        {days.map((day) => (
          <CalendarDayCell
            key={day.toISOString()}
            day={day}
            inMonth={isSameMonth(day, month)}
            today={format(day, "yyyy-MM-dd") === dayKey()}
            items={itemsForDay(day)}
            onClick={() => { setSelectedDate(day); setAdding(false); }}
          />
        ))}
      </div>

      <CalendarDayDialog
        date={selectedDate}
        initiallyAdding={adding}
        items={selectedDate ? itemsForDay(selectedDate) : []}
        onOpenChange={(open) => !open && setSelectedDate(null)}
      />
    </>
  );
}
