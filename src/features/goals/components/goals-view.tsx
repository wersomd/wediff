"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import {
  Archive,
  CalendarClock,
  Check,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Target,
  Trash2,
} from "lucide-react";
import { GoalStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { GoalDialog } from "./goal-dialog";
import {
  addKeyResult,
  deleteGoal,
  deleteKeyResult,
  setGoalProgress,
  setGoalStatus,
  toggleKeyResult,
} from "../actions";
import type { GoalRow } from "../queries";

export function GoalsView({ goals }: { goals: GoalRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GoalRow | null>(null);

  function act(fn: () => Promise<{ ok: true } | { error: string }>, ok?: string) {
    start(async () => {
      const res = await fn();
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      if (ok) toast.success(ok);
      router.refresh();
    });
  }

  function remove(g: GoalRow) {
    if (!window.confirm(`Удалить цель «${g.title}»?`)) return;
    act(() => deleteGoal(g.id), "Цель удалена");
  }

  return (
    <>
      <PageHeader
        title="Цели"
        description="Большие цели с прогрессом и ключевыми результатами."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Новая цель
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Целей пока нет"
          description="Поставьте первую: что хотите достичь и к какому сроку."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => {
                setEditing(g);
                setDialogOpen(true);
              }}
              onDelete={() => remove(g)}
              act={act}
            />
          ))}
        </div>
      )}

      <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} goal={editing} />
    </>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  act,
}: {
  goal: GoalRow;
  onEdit: () => void;
  onDelete: () => void;
  act: (
    fn: () => Promise<{ ok: true } | { error: string }>,
    ok?: string,
  ) => void;
}) {
  const [newKr, setNewKr] = useState("");
  const settled = goal.status !== GoalStatus.ACTIVE;

  const hasTarget = goal.targetValue != null && goal.targetValue > 0;
  const krDone = goal.keyResults.filter((k) => k.done).length;
  const progress = hasTarget
    ? Math.min(100, Math.round((goal.currentValue / goal.targetValue!) * 100))
    : goal.keyResults.length > 0
      ? Math.round((krDone / goal.keyResults.length) * 100)
      : 0;

  function addKr() {
    const title = newKr.trim();
    if (!title) return;
    setNewKr("");
    act(() => addKeyResult({ goalId: goal.id, title }));
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4",
        settled && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-medium leading-tight">{goal.title}</h3>
          {goal.description && (
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-md p-1 text-muted-foreground outline-none hover:bg-accent"
            aria-label="Действия"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit} className="cursor-pointer">
              <Pencil className="size-4" />
              Редактировать
            </DropdownMenuItem>
            {goal.status !== GoalStatus.DONE ? (
              <DropdownMenuItem
                onSelect={() =>
                  act(() => setGoalStatus(goal.id, GoalStatus.DONE), "Цель достигнута 🎉")
                }
                className="cursor-pointer"
              >
                <Check className="size-4" />
                Достигнута
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => act(() => setGoalStatus(goal.id, GoalStatus.ACTIVE))}
                className="cursor-pointer"
              >
                <RotateCcw className="size-4" />
                Вернуть в работу
              </DropdownMenuItem>
            )}
            {goal.status !== GoalStatus.ARCHIVED && (
              <DropdownMenuItem
                onSelect={() => act(() => setGoalStatus(goal.id, GoalStatus.ARCHIVED))}
                className="cursor-pointer"
              >
                <Archive className="size-4" />
                В архив
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={onDelete}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(hasTarget || goal.keyResults.length > 0) && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-sm tabular-nums">
            <span className="text-muted-foreground">
              {hasTarget
                ? `${goal.currentValue} / ${goal.targetValue}${goal.unit ? ` ${goal.unit}` : ""}`
                : `${krDone} / ${goal.keyResults.length}`}
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {hasTarget && goal.status === GoalStatus.ACTIVE && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => act(() => setGoalProgress(goal.id, goal.currentValue + 1))}
          >
            +1
          </Button>
          <Input
            type="number"
            step="0.01"
            min="0"
            defaultValue={goal.currentValue}
            className="h-8 w-24"
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v !== goal.currentValue) {
                act(() => setGoalProgress(goal.id, v));
              }
            }}
            aria-label="Текущее значение"
          />
        </div>
      )}

      {goal.keyResults.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {goal.keyResults.map((k) => (
            <li key={k.id} className="group flex items-center gap-2 text-sm">
              <Checkbox
                checked={k.done}
                onCheckedChange={(v) =>
                  act(() => toggleKeyResult(k.id, Boolean(v)))
                }
              />
              <span className={cn("flex-1", k.done && "text-muted-foreground line-through")}>
                {k.title}
              </span>
              <button
                type="button"
                onClick={() => act(() => deleteKeyResult(k.id))}
                className="rounded-md p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                aria-label="Удалить результат"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {goal.status === GoalStatus.ACTIVE && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={newKr}
            onChange={(e) => setNewKr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKr()}
            placeholder="Ключевой результат…"
            className="h-8"
          />
          <Button size="sm" variant="ghost" onClick={addKr} disabled={!newKr.trim()}>
            <Plus className="size-4" />
          </Button>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {goal.status === GoalStatus.DONE && (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs">
            Достигнута
          </Badge>
        )}
        {goal.status === GoalStatus.ARCHIVED && (
          <Badge variant="outline" className="text-xs">
            В архиве
          </Badge>
        )}
        {goal.dueDate && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            {format(goal.dueDate, "d MMM yyyy", { locale: ru })}
          </span>
        )}
      </div>
    </div>
  );
}
