"use client";

import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { useWorkspaceIntent } from "@/components/shared/use-workspace-intent";
import { Input } from "@/components/ui/input";
import { ALL } from "../constants";
import { Button } from "@/components/ui/button";
import { Board, type Columns } from "./board";
import { TaskList } from "./task-list";
import { TaskDialog } from "./task-dialog";
import { ViewSwitcher } from "./view-switcher";
import { TaskFilters } from "./task-filters";
import { createTask, moveTask, toggleDone } from "../actions";
import { TASK_STATUS_ORDER } from "../constants";
import { useTaskView } from "../use-task-view";
import { applyTaskView, matchesFilters, sortTasks } from "../view";
import type { ProjectOption, TaskWithProject } from "../queries";

function groupByStatus(tasks: TaskWithProject[]): Columns {
  const columns = {} as Columns;
  for (const status of TASK_STATUS_ORDER) {
    columns[status] = tasks.filter((t) => t.status === status);
  }
  return columns;
}

type TasksViewProps = {
  initialTasks: TaskWithProject[];
  projects: ProjectOption[];
  lockedProjectId?: string;
};

// useTaskView() reads the URL query string, so the tree needs a Suspense
// boundary (Next 15 requirement for useSearchParams).
export function TasksView(props: TasksViewProps) {
  return (
    <Suspense fallback={<div className="h-9" />}>
      <TasksViewInner {...props} />
    </Suspense>
  );
}

function TasksViewInner({
  initialTasks,
  projects,
  lockedProjectId,
}: TasksViewProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { view, filters, sort, isFiltered, setView, setFilters, setSort, reset } =
    useTaskView();

  // Raw per-status order, kept in sync with the server. Drag mutations write
  // here; the board/list derive their filtered + sorted views from it.
  const [columns, setColumns] = useState<Columns>(() =>
    groupByStatus(initialTasks),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithProject | null>(null);

  useEffect(() => {
    setColumns(groupByStatus(initialTasks));
  }, [initialTasks]);

  // Dragging only makes sense in the stored order with every card visible:
  // once a sort or a filter is on, a reordered subset can't be persisted
  // faithfully, so drag is locked until the user clears both.
  const dndDisabled = sort !== "manual" || isFiltered;

  const boardColumns = useMemo(() => {
    const now = new Date();
    const out = {} as Columns;
    for (const s of TASK_STATUS_ORDER) {
      out[s] = sortTasks(
        columns[s].filter((t) => matchesFilters(t, filters, now)),
        sort,
      );
    }
    return out;
  }, [columns, filters, sort]);

  const listTasks = useMemo(
    () =>
      applyTaskView(
        TASK_STATUS_ORDER.flatMap((s) => columns[s]),
        filters,
        sort,
      ),
    [columns, filters, sort],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  useWorkspaceIntent({ onCreate: openCreate, onItem: (id) => {
    const task = initialTasks.find((t) => t.id === id);
    if (task) { setEditing(task); setDialogOpen(true); }
    else toast.error("Задача не найдена");
  } });

  function addTask(title: string, status: TaskStatus) {
    start(async () => {
      try {
      const res = await createTask({
        title,
        status,
        projectId: lockedProjectId ?? "",
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
      } catch { toast.error("Не удалось создать задачу. Попробуйте ещё раз."); }
    });
  }

  function persistMove(
    taskId: string,
    toStatus: TaskStatus,
    orderedIds: string[],
  ) {
    start(async () => {
      try {
        const res = await moveTask({ taskId, toStatus, orderedIds });
        if ("error" in res) throw new Error(res.error);
        router.refresh();
      } catch {
        setColumns(groupByStatus(initialTasks));
        toast.error("Не удалось переместить задачу. Порядок восстановлен.");
      }
    });
  }

  function onToggle(id: string, done: boolean) {
    if (pending) return;
    const previous = columns;
    const target = done ? TaskStatus.DONE : TaskStatus.TODO;
    setColumns((prev) => moveToStatus(prev, id, target));
    start(async () => {
      try {
        const res = await toggleDone(id, done);
        if ("error" in res) throw new Error(res.error);
        router.refresh();
      } catch {
        setColumns(previous);
        toast.error("Не удалось сохранить задачу. Попробуйте ещё раз.");
      }
    });
  }

  function onCardClick(task: TaskWithProject) {
    setEditing(task);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewSwitcher view={view} onChange={setView} />
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Задача
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap gap-1">
          {[{ label: "Все задачи", due: ALL, status: ALL }, { label: "Открытые", due: ALL, status: "OPEN" }, { label: "Сегодня", due: "TODAY", status: "OPEN" }, { label: "Просрочено", due: "OVERDUE", status: "OPEN" }, { label: "На неделе", due: "WEEK", status: "OPEN" }].map((preset) => <button key={preset.label} className="workspace-tab" aria-pressed={filters.due === preset.due && filters.status === preset.status} onClick={() => setFilters({ ...filters, due: preset.due, status: preset.status })}>{preset.label}</button>)}
        </div>
        <div className="relative w-full sm:w-56"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Поиск задач" placeholder="Найти задачу…" value={filters.query ?? ""} onChange={(e) => setFilters({ ...filters, query: e.target.value })} className="pl-9" /></div>
      </div>
      <TaskFilters
        filters={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        onReset={reset}
        isFiltered={isFiltered}
        projects={projects}
        showProject={!lockedProjectId}
      />

      {view === "board" && dndDisabled && <p className="rounded-lg bg-primary/5 px-4 py-3 text-xs text-muted-foreground">Чтобы менять порядок перетаскиванием, сбросьте фильтры и выберите сортировку «Вручную». Статус можно изменить в карточке задачи.</p>}
      {view === "board" ? (
        <Board
          columns={boardColumns}
          dndDisabled={dndDisabled || pending}
          onColumnsChange={setColumns}
          onMoveEnd={persistMove}
          onAddTask={addTask}
          onCardClick={onCardClick}
        />
      ) : (
        <TaskList
          tasks={listTasks}
          disabled={pending}
          onToggle={onToggle}
          onCardClick={onCardClick}
        />
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        projects={projects}
        lockedProjectId={lockedProjectId}
      />
    </div>
  );
}

// Move a task to another status column (append to the end), updating its status.
function moveToStatus(
  columns: Columns,
  id: string,
  status: TaskStatus,
): Columns {
  let moved: TaskWithProject | undefined;
  const next = {} as Columns;
  for (const s of TASK_STATUS_ORDER) {
    next[s] = columns[s].filter((t) => {
      if (t.id === id) {
        moved = t;
        return false;
      }
      return true;
    });
  }
  if (moved) next[status] = [...next[status], { ...moved, status }];
  return next;
}
