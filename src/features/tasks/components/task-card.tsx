"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ban, CalendarClock, CheckCircle2 } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { PriorityDot } from "./priority-badge";
import { formatDue } from "../format";
import type { TaskWithProject } from "../queries";

export function TaskCard({
  task,
  onClick,
  overlay = false,
}: {
  task: TaskWithProject;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { status: task.status } });

  const done = task.status === TaskStatus.DONE;
  const cancelled = task.status === TaskStatus.CANCELLED;
  const finished = done || cancelled;
  const due = task.dueDate ? formatDue(task.dueDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group cursor-grab touch-none rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-foreground/20 active:cursor-grabbing",
        isDragging && "opacity-40",
        finished && "bg-muted/30",
        overlay && "cursor-grabbing shadow-lg ring-1 ring-border",
      )}
    >
      <div className="flex items-start gap-2">
        {done ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
        ) : cancelled ? (
          <Ban className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        ) : (
          <PriorityDot priority={task.priority} className="mt-1.5" />
        )}
        <p
          className={cn(
            "flex-1 text-sm leading-snug",
            finished && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
      </div>
      {(due || task.project) && (
        <div
          className={cn(
            "mt-2 flex flex-wrap items-center gap-2",
            finished ? "pl-6" : "pl-4",
          )}
        >
          {due && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                due.overdue && !finished
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              <CalendarClock className="size-3" />
              {due.label}
            </span>
          )}
          {task.project && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: task.project.color ?? "#8b5cf6" }}
              />
              {task.project.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
