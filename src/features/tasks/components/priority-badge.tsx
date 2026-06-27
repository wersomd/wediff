import type { TaskPriority } from "@prisma/client";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_DOT, TASK_PRIORITY_LABELS } from "../constants";

export function PriorityDot({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", TASK_PRIORITY_DOT[priority], className)}
      title={`Приоритет: ${TASK_PRIORITY_LABELS[priority]}`}
      aria-label={`Приоритет: ${TASK_PRIORITY_LABELS[priority]}`}
    />
  );
}
