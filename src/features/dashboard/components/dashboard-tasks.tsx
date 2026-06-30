"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Check } from "lucide-react";
import type { TaskPriority } from "@prisma/client";
import { toggleDone } from "@/features/tasks/actions";
import { cn } from "@/lib/utils";

type DueTask = {
  id: string;
  title: string;
  dueDate: Date;
  priority: TaskPriority;
};

// Checkbox ring tinted by priority so the big checker still signals urgency.
const PRIORITY_RING: Record<TaskPriority, string> = {
  LOW: "border-muted-foreground/40 hover:border-muted-foreground/70",
  MEDIUM: "border-blue-500/60 hover:border-blue-500",
  HIGH: "border-amber-500/70 hover:border-amber-500",
  URGENT: "border-red-500/70 hover:border-red-500",
};

export function DashboardTasks({ tasks }: { tasks: DueTask[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Tasks the user just checked — optimistically struck through before refresh.
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  if (tasks.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        На сегодня ничего не запланировано.
      </p>
    );
  }

  function complete(id: string) {
    setCompleted((prev) => new Set(prev).add(id));
    startTransition(async () => {
      await toggleDone(id, true);
      router.refresh();
    });
  }

  const now = new Date();

  return (
    <ul className="divide-y divide-border">
      {tasks.map((t) => {
        const done = completed.has(t.id);
        const overdue = !done && differenceInCalendarDays(t.dueDate, now) < 0;
        return (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <button
              type="button"
              onClick={() => complete(t.id)}
              disabled={done}
              aria-label={done ? "Выполнено" : "Отметить выполненной"}
              aria-pressed={done}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : PRIORITY_RING[t.priority],
              )}
            >
              {done && <Check className="size-3" strokeWidth={3} />}
            </button>
            <span
              className={cn(
                "flex-1 truncate text-sm transition-colors",
                done && "text-muted-foreground line-through",
              )}
            >
              {t.title}
            </span>
            <span
              className={cn(
                "text-xs tabular-nums",
                overdue ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {format(t.dueDate, "d MMM", { locale: ru })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
