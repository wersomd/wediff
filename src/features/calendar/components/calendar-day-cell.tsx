"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CALENDAR_ITEM_CHIP } from "../constants";
import type { CalendarItem } from "../queries";

const MAX_VISIBLE = 3;

export function CalendarDayCell({
  day,
  inMonth,
  today,
  items,
  onClick,
}: {
  day: Date;
  inMonth: boolean;
  today: boolean;
  items: CalendarItem[];
  onClick: () => void;
}) {
  const visible = items.slice(0, MAX_VISIBLE);
  const overflow = items.length - visible.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 min-h-24 sm:min-h-32 flex-col items-stretch gap-1 bg-card p-1 sm:p-2 text-left align-top transition-colors hover:bg-accent/50",
        !inMonth && "bg-card/40 text-muted-foreground/50",
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
          today && "bg-primary font-medium text-primary-foreground",
        )}
      >
        {format(day, "d")}
      </span>
      {items.length > 0 && (
        <div className="flex min-w-0 flex-col gap-0.5">
          {visible.map((item) => (
            <span
              key={item.id}
              title={item.title}
              className={cn(
                "truncate rounded px-1 py-0.5 text-[10px] leading-tight",
                CALENDAR_ITEM_CHIP[item.kind],
              )}
            >
              {item.title}
            </span>
          ))}
          {overflow > 0 && (
            <span className="px-1 text-[10px] text-muted-foreground">+{overflow} ещё</span>
          )}
        </div>
      )}
    </button>
  );
}
