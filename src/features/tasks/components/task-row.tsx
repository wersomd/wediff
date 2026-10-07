"use client";
import { CalendarClock } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { PriorityDot } from "./priority-badge";
import { dateLabel, daysFromToday } from "@/lib/workspace-date";
import { OPEN_TASK_STATUSES, STATUS_ACCENT, TASK_STATUS_LABELS } from "../constants";
import type { TaskWithProject } from "../queries";

export function TaskRow({ task, onToggle, onClick, disabled = false }: {
  task: TaskWithProject; onToggle: (done: boolean) => void; onClick: () => void; disabled?: boolean;
}) {
  const done = task.status === TaskStatus.DONE;
  const cancelled = task.status === TaskStatus.CANCELLED;
  const days = task.dueDate ? daysFromToday(task.dueDate) : null;
  const overdue = days !== null && days < 0 && OPEN_TASK_STATUSES.includes(task.status);
  return <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 last:border-0 hover:bg-muted/40 md:px-5">
    <Checkbox checked={done} disabled={disabled || cancelled} onCheckedChange={(v) => onToggle(v === true)} aria-label={`${done ? "Вернуть в план" : "Завершить"}: ${task.title}`} />
    <div className="min-w-0 flex-1">
      <button type="button" onClick={onClick} className={cn("block w-full truncate text-left text-sm font-medium", (done || cancelled) && "text-muted-foreground line-through")}>{task.title}</button>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {task.project && <span className="inline-flex max-w-[180px] items-center gap-1.5 truncate"><span className="size-1.5 shrink-0 rounded-full bg-primary" />{task.project.name}</span>}
        {task.dueDate && <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}><CalendarClock className="size-3" />{days === 0 ? "Сегодня" : days === 1 ? "Завтра" : dateLabel(task.dueDate)}{overdue && " · просрочено"}</span>}
      </div>
    </div>
    <PriorityDot priority={task.priority} />
    <span className="hidden items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium sm:inline-flex"><span className={cn("size-1.5 rounded-full", STATUS_ACCENT[task.status].dot)} />{TASK_STATUS_LABELS[task.status]}</span>
  </div>;
}
