"use client";

import { useId, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { TaskStatus } from "@prisma/client";
import { BoardColumn } from "./board-column";
import { TaskCard } from "./task-card";
import { TASK_STATUS_ORDER } from "../constants";
import type { TaskWithProject } from "../queries";

export type Columns = Record<TaskStatus, TaskWithProject[]>;

export function Board({
  columns,
  onColumnsChange,
  onMoveEnd,
  onAddTask,
  onCardClick,
}: {
  columns: Columns;
  onColumnsChange: (next: Columns) => void;
  onMoveEnd: (
    taskId: string,
    toStatus: TaskStatus,
    orderedIds: string[],
  ) => void;
  onAddTask: (title: string, status: TaskStatus) => void;
  onCardClick: (task: TaskWithProject) => void;
}) {
  const [activeTask, setActiveTask] = useState<TaskWithProject | null>(null);
  // Stable id so dnd-kit's generated a11y ids match between SSR and client
  // (otherwise React reports a hydration mismatch on aria-describedby).
  const dndId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function columnOf(id: string): TaskStatus | null {
    if (id.startsWith("col:")) return id.slice(4) as TaskStatus;
    for (const status of TASK_STATUS_ORDER) {
      if (columns[status].some((t) => t.id === id)) return status;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const status = columnOf(id);
    if (!status) return;
    setActiveTask(columns[status].find((t) => t.id === id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    // dnd-kit keeps the dimmed source card mounted in place for the whole
    // drag (DragOverlay renders the moving copy separately). Releasing near
    // a column boundary can leave the pointer over that dimmed original, so
    // over.id === active.id — treat that as "dropped back where it was",
    // not as a real target (sourceItems below has activeId filtered out, so
    // resolving it as a target would miscompute the index as -1).
    if (overId === activeId) return;
    const sourceCol = columnOf(activeId);
    const targetCol = columnOf(overId);
    if (!sourceCol || !targetCol) return;

    const moved = columns[sourceCol].find((t) => t.id === activeId);
    if (!moved) return;

    const sourceItems = columns[sourceCol].filter((t) => t.id !== activeId);
    const targetBase = sourceCol === targetCol ? sourceItems : columns[targetCol];

    let index = overId.startsWith("col:")
      ? targetBase.length
      : targetBase.findIndex((t) => t.id === overId);
    if (index < 0) index = targetBase.length;

    const targetItems = [
      ...targetBase.slice(0, index),
      { ...moved, status: targetCol },
      ...targetBase.slice(index),
    ];

    const next: Columns = { ...columns };
    next[sourceCol] = sourceItems;
    next[targetCol] = targetItems;

    // No-op guard: same column, same position.
    if (
      sourceCol === targetCol &&
      columns[sourceCol].findIndex((t) => t.id === activeId) === index
    ) {
      return;
    }

    onColumnsChange(next);
    onMoveEnd(activeId, targetCol, targetItems.map((t) => t.id));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={columns[status]}
            onAddTask={onAddTask}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
