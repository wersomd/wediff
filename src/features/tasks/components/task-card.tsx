"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock } from "lucide-react";
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
        overlay && "cursor-grabbing shadow-lg ring-1 ring-border",
      )}
    >
      <div className="flex items-start gap-2">
        <PriorityDot priority={task.priority} className="mt-1.5" />
        <p className="flex-1 text-sm leading-snug">{task.title}</p>
      </div>
      {(due || task.project) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-4">
          {due && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                due.overdue ? "text-destructive" : "text-muted-foreground",
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
