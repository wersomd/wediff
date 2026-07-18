"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Ban, CalendarClock, CheckCircle2 } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_STRIPE } from "../constants";
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
  } = useSortable({
    id: task.id,
    data: { status: task.status },
    transition: { duration: 150, easing: "ease-out" },
  });

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
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "group cursor-grab touch-none rounded-lg border border-l-[3px] border-border bg-card p-3 text-left shadow-sm transition-shadow duration-150 hover:shadow-md active:cursor-grabbing",
          TASK_PRIORITY_STRIPE[task.priority],
          isDragging && "opacity-40",
          finished && "bg-muted/30",
          overlay && "scale-[1.03] cursor-grabbing shadow-lg ring-1 ring-border",
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
      </motion.div>
    </div>
  );
}
