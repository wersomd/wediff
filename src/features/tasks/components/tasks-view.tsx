"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Board, type Columns } from "./board";
import { TaskList } from "./task-list";
import { TaskDialog } from "./task-dialog";
import { ViewSwitcher, type TaskView } from "./view-switcher";
import { TaskFilters } from "./task-filters";
import { createTask, moveTask, toggleDone } from "../actions";
import { ALL, TASK_STATUS_ORDER, type TaskFiltersState } from "../constants";
import type { ProjectOption, TaskWithProject } from "../queries";

const EMPTY_FILTERS: TaskFiltersState = {
  status: ALL,
  priority: ALL,
  projectId: ALL,
};

function groupByStatus(tasks: TaskWithProject[]): Columns {
  const columns = {} as Columns;
  for (const status of TASK_STATUS_ORDER) {
    columns[status] = tasks.filter((t) => t.status === status);
  }
  return columns;
}

export function TasksView({
  initialTasks,
  projects,
  lockedProjectId,
}: {
  initialTasks: TaskWithProject[];
  projects: ProjectOption[];
  lockedProjectId?: string;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [view, setView] = useState<TaskView>("board");
  const [columns, setColumns] = useState<Columns>(() =>
    groupByStatus(initialTasks),
  );
  const [filters, setFilters] = useState<TaskFiltersState>(EMPTY_FILTERS);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithProject | null>(null);

  // Reconcile local state whenever the server sends fresh data.
  useEffect(() => {
    setColumns(groupByStatus(initialTasks));
  }, [initialTasks]);

  const flatTasks = useMemo(
    () => TASK_STATUS_ORDER.flatMap((s) => columns[s]),
    [columns],
  );

  const filtered = useMemo(
    () =>
      flatTasks.filter((t) => {
        if (filters.status !== ALL && t.status !== filters.status) return false;
        if (filters.priority !== ALL && t.priority !== filters.priority)
          return false;
        if (
          filters.projectId !== ALL &&
          (t.projectId ?? "") !== filters.projectId
        )
          return false;
        return true;
      }),
    [flatTasks, filters],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function addTask(title: string, status: TaskStatus) {
    start(async () => {
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
    });
  }

  function persistMove(
    taskId: string,
    toStatus: TaskStatus,
    orderedIds: string[],
  ) {
    start(async () => {
      const res = await moveTask({ taskId, toStatus, orderedIds });
      if ("error" in res) {
        toast.error(res.error);
        router.refresh(); // revert to server truth
      }
    });
  }

  function onToggle(id: string, done: boolean) {
    const target = done ? TaskStatus.DONE : TaskStatus.TODO;
    setColumns((prev) => moveToStatus(prev, id, target));
    start(async () => {
      const res = await toggleDone(id, done);
      if ("error" in res) {
        toast.error(res.error);
        router.refresh();
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
        <div className="flex items-center gap-2">
          {view === "list" && (
            <TaskFilters
              filters={filters}
              onChange={setFilters}
              projects={projects}
              showProject={!lockedProjectId}
            />
          )}
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Задача
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <Board
          columns={columns}
          onColumnsChange={setColumns}
          onMoveEnd={persistMove}
          onAddTask={addTask}
          onCardClick={onCardClick}
        />
      ) : (
        <TaskList
          tasks={filtered}
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
