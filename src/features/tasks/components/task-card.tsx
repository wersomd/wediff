"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ban, CalendarClock, CheckCircle2, GripVertical } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_DOT } from "../constants";
import { formatDue, overdueLabel } from "../format";
import type { TaskWithProject } from "../queries";

export function TaskCard({
  task,
  onClick,
  dndDisabled = false,
  overlay = false,
}: {
  task: TaskWithProject;
  onClick?: () => void;
  dndDisabled?: boolean;
  overlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { status: task.status },
    disabled: dndDisabled,
    transition: { duration: 150, easing: "ease-out" },
  });

  const done = task.status === TaskStatus.DONE;
  const cancelled = task.status === TaskStatus.CANCELLED;
  const finished = done || cancelled;
  const due = task.dueDate ? formatDue(task.dueDate, task.status) : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        onClick={onClick}
        className={cn(
          "group rounded-md border border-border bg-card p-3 text-left transition-colors duration-150 hover:bg-muted/40",
          dndDisabled
            ? "cursor-pointer"
            : "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-40",
          finished && "bg-muted/30",
          overlay && "scale-[1.02] cursor-grabbing ring-1 ring-border",
        )}
      >
        <div className="flex items-start gap-2">
          {done ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          ) : cancelled ? (
            <Ban className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          ) : null}
          <button type="button" aria-label={`Открыть задачу: ${task.title}`} onClick={e => { e.stopPropagation(); onClick?.(); }}
            className={cn(
              "min-w-0 flex-1 break-words text-left text-sm font-medium leading-relaxed outline-none focus-visible:underline",
              finished && "font-normal text-muted-foreground line-through",
            )}
          >
            {task.title}
          </button>
          {!overlay && !dndDisabled && <button type="button" {...attributes} {...listeners} aria-label={`Переместить: ${task.title}`} onClick={e => e.stopPropagation()} onKeyDown={e => { e.stopPropagation(); listeners?.onKeyDown?.(e); }} className="-mr-1 -mt-1 shrink-0 touch-none rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"><GripVertical className="size-3.5" /></button>}
        </div>
        {(
          <div
            className={cn(
              "mt-2 flex flex-wrap items-center gap-2",
              finished && "pl-6",
            )}
          >
            <span title={`Приоритет: ${TASK_PRIORITY_LABELS[task.priority]}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className={cn("size-1.5 rounded-full", TASK_PRIORITY_DOT[task.priority])} />{TASK_PRIORITY_LABELS[task.priority]}</span>
            {due && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  due.overdue ? "text-destructive" : "text-muted-foreground",
                )}
              >
                <CalendarClock className="size-3" />
                {due.overdue ? overdueLabel(due.overdueDays) : due.label}
              </span>
            )}
            {task.project && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: task.project.color ?? "#2E5CFF" }}
                />
                {task.project.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
