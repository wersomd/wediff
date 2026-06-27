"use client";

import { CalendarClock } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { PriorityDot } from "./priority-badge";
import { formatDue } from "../format";
import { TASK_STATUS_LABELS } from "../constants";
import type { TaskWithProject } from "../queries";

export function TaskRow({
  task,
  onToggle,
  onClick,
}: {
  task: TaskWithProject;
  onToggle: (done: boolean) => void;
  onClick: () => void;
}) {
  const done = task.status === TaskStatus.DONE;
  const cancelled = task.status === TaskStatus.CANCELLED;
  const due = task.dueDate ? formatDue(task.dueDate) : null;

  return (
    <div className="flex items-center gap-3 border-b border-border px-2 py-2.5 last:border-0 hover:bg-accent/40">
      <Checkbox
        checked={done}
        onCheckedChange={(v) => onToggle(v === true)}
        aria-label="Отметить выполненной"
      />
      <PriorityDot priority={task.priority} />
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex-1 truncate text-left text-sm",
          (done || cancelled) && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </button>

      {due && (
        <span
          className={cn(
            "hidden items-center gap-1 text-xs sm:inline-flex",
            due.overdue && !done ? "text-destructive" : "text-muted-foreground",
          )}
        >
          <CalendarClock className="size-3" />
          {due.label}
        </span>
      )}

      {task.project && (
        <span className="hidden items-center gap-1 text-xs text-muted-foreground md:inline-flex">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: task.project.color ?? "#8b5cf6" }}
          />
          {task.project.name}
        </span>
      )}

      <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground lg:inline">
        {TASK_STATUS_LABELS[task.status]}
      </span>
    </div>
  );
}
