"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ban, CalendarClock, CheckCircle2 } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_STRIPE } from "../constants";
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
      {...attributes}
      {...listeners}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Открыть задачу: ${task.title}`}
      onKeyDown={(event) => {
        if (event.key === "Enter") { event.preventDefault(); onClick?.(); }
        else listeners?.onKeyDown?.(event);
      }}
      // dnd-kit's PointerSensor needs touch-action:none *on the element that
      // receives the pointer events* or a touch drag never starts (the browser
      // claims the gesture for scrolling); select-none stops a mouse press from
      // selecting the card text instead of dragging.
      className={cn(!dndDisabled && "touch-none select-none")}
    >
      <div
        className={cn(
          "group rounded-md border border-l-[3px] border-border bg-card p-3 text-left transition-colors duration-150 hover:bg-muted/40",
          dndDisabled
            ? "cursor-pointer"
            : "cursor-grab active:cursor-grabbing",
          TASK_PRIORITY_STRIPE[task.priority],
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
          <p
            className={cn(
              "flex-1 text-sm font-medium leading-snug",
              finished && "font-normal text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
        </div>
        {(due || task.project) && (
          <div
            className={cn(
              "mt-2 flex flex-wrap items-center gap-2",
              finished && "pl-6",
            )}
          >
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
