"use client";

import { ListTodo } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskRow } from "./task-row";
import type { TaskWithProject } from "../queries";

export function TaskList({
  tasks,
  onToggle,
  onCardClick,
}: {
  tasks: TaskWithProject[];
  onToggle: (id: string, done: boolean) => void;
  onCardClick: (task: TaskWithProject) => void;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="Нет задач"
        description="Измените фильтры или добавьте новую задачу."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={(done) => onToggle(task.id, done)}
          onClick={() => onCardClick(task)}
        />
      ))}
    </div>
  );
}
