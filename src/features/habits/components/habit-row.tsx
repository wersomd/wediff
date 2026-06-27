"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Flame, MoreHorizontal, Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { HabitFrequency } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { currentStreak, lastDays, todayKey, weekCount } from "../dates";
import { DEFAULT_HABIT_COLOR } from "../constants";
import type { HabitWithEntries } from "../queries";

export function HabitRow({
  habit,
  done,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
}: {
  habit: HabitWithEntries;
  done: Set<string>;
  onToggle: (dayKey: string) => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const color = habit.color ?? DEFAULT_HABIT_COLOR;
  const days = lastDays(7);
  const today = todayKey();
  const isWeekly = habit.frequency === HabitFrequency.WEEKLY;
  const streak = currentStreak(done);
  const week = weekCount(done);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
        habit.archived && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-lg"
          style={{ backgroundColor: `${color}22` }}
        >
          {habit.icon || "•"}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{habit.name}</h3>
            {isWeekly ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {week}/{habit.target} за неделю
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                <Flame className={cn("size-3.5", streak > 0 && "text-amber-500")} />
                {streak}
              </span>
            )}
          </div>
          {habit.description && (
            <p className="truncate text-sm text-muted-foreground">
              {habit.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {days.map((key) => {
          const date = new Date(`${key}T00:00:00`);
          const isDone = done.has(key);
          const isToday = key === today;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              title={format(date, "d MMM", { locale: ru })}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[10px] uppercase text-muted-foreground">
                {format(date, "EEEEEE", { locale: ru })}
              </span>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-xs transition-colors",
                  isToday ? "border-foreground/40" : "border-border",
                  isDone ? "text-white" : "text-muted-foreground hover:bg-accent",
                )}
                style={isDone ? { backgroundColor: color, borderColor: color } : undefined}
              >
                {format(date, "d")}
              </span>
            </button>
          );
        })}

        <DropdownMenu>
          <DropdownMenuTrigger
            className="ml-1 rounded-md p-1 text-muted-foreground outline-none hover:bg-accent"
            aria-label="Действия"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit} className="cursor-pointer">
              <Pencil className="size-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onArchive} className="cursor-pointer">
              {habit.archived ? (
                <>
                  <ArchiveRestore className="size-4" />
                  Вернуть из архива
                </>
              ) : (
                <>
                  <Archive className="size-4" />
                  В архив
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onDelete}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
