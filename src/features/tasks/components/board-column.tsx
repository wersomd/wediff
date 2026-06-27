"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import { QuickAdd } from "./quick-add";
import { TASK_STATUS_LABELS } from "../constants";
import type { TaskWithProject } from "../queries";

export function BoardColumn({
  status,
  tasks,
  onAddTask,
  onCardClick,
}: {
  status: TaskStatus;
  tasks: TaskWithProject[];
  onAddTask: (title: string, status: TaskStatus) => void;
  onCardClick: (task: TaskWithProject) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${status}`,
    data: { status, columnId: status },
  });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-2 flex-1 flex-col gap-2 px-2 pb-2 transition-colors",
          isOver && "rounded-lg bg-accent/40",
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="px-2 pb-2">
        <QuickAdd
          onAdd={(title) => onAddTask(title, status)}
          placeholder="Добавить задачу"
        />
      </div>
    </div>
  );
}
