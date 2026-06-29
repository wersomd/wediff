"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import {
  Activity,
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { MetricDialog } from "./metric-dialog";
import { LogDialog } from "./log-dialog";
import { deleteMetric, setMetricArchived } from "../actions";
import type { HealthLogRow, HealthMetricRow } from "../queries";

export function HealthView({ metrics }: { metrics: HealthMetricRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HealthMetricRow | null>(null);
  const [logFor, setLogFor] = useState<HealthMetricRow | null>(null);

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

  function remove(m: HealthMetricRow) {
    if (!window.confirm(`Удалить метрику «${m.name}» со всеми записями?`)) return;
    act(() => deleteMetric(m.id), "Метрика удалена");
  }

  return (
    <>
      <PageHeader
        title="Здоровье"
        description="Показатели тела и привычки: вес, сон, вода — что угодно."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setMetricDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Новая метрика
          </Button>
        }
      />

      {metrics.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Метрик пока нет"
          description="Добавьте показатель — например «Вес» (кг) или «Вода» (мл)."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col rounded-xl border border-border bg-card p-4",
                m.archived && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-lg">
                    {m.icon || "📊"}
                  </span>
                  <div>
                    <h3 className="font-medium leading-tight">{m.name}</h3>
                    {m.target != null && (
                      <span className="text-xs text-muted-foreground">
                        цель {m.target}
                        {m.unit ? ` ${m.unit}` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="rounded-md p-1 text-muted-foreground outline-none hover:bg-accent"
                    aria-label="Действия"
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(m);
                        setMetricDialogOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Pencil className="size-4" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => act(() => setMetricArchived(m.id, !m.archived))}
                      className="cursor-pointer"
                    >
                      {m.archived ? (
                        <>
                          <ArchiveRestore className="size-4" />
                          Вернуть
                        </>
                      ) : (
                        <>
                          <Archive className="size-4" />
                          В архив
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => remove(m)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3">
                {m.latest ? (
                  <p className="text-2xl font-semibold tabular-nums">
                    {m.latest.value}
                    {m.unit ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        {m.unit}
                      </span>
                    ) : null}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {format(m.latest.date, "d MMM", { locale: ru })}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет записей</p>
                )}
              </div>

              <Sparkline logs={m.logs} target={m.target} />

              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setLogFor(m)}
              >
                <Plus className="size-4" />
                Записать
              </Button>
            </div>
          ))}
        </div>
      )}

      <MetricDialog
        open={metricDialogOpen}
        onOpenChange={setMetricDialogOpen}
        metric={editing}
      />
      <LogDialog metric={logFor} onOpenChange={(open) => !open && setLogFor(null)} />
    </>
  );
}

function Sparkline({
  logs,
  target,
}: {
  logs: HealthLogRow[];
  target: number | null;
}) {
  if (logs.length < 2) return <div className="mt-3 h-10" />;
  const values = logs.map((l) => l.value);
  const max = Math.max(...values, target ?? 0);
  const min = Math.min(...values, target ?? values[0]);
  const range = max - min || 1;

  return (
    <div className="mt-3 flex h-10 items-end gap-0.5">
      {logs.map((l) => {
        const h = 10 + ((l.value - min) / range) * 90;
        return (
          <div
            key={l.id}
            className="flex-1 rounded-sm bg-primary/60"
            style={{ height: `${h}%` }}
            title={`${l.value}`}
          />
        );
      })}
    </div>
  );
}
