import type { TaskStatus } from "@prisma/client";
import type { Columns } from "./components/board";
import { TASK_STATUS_ORDER } from "./constants";
export function resolveTaskView(raw: string | null): "board" | "list" {
  return raw === "list" ? "list" : "board";
}
/** Replace only the submitted slots; retain hidden tasks and their relative order. */
export function mergeTaskOrder(all: string[], ordered: string[]): string[] {
  const selected = new Set(ordered);
  if (selected.size !== ordered.length || ordered.some(id => !all.includes(id))) throw new Error("Некорректный порядок задач");
  let index = 0;
  return all.map(id => selected.has(id) ? ordered[index++] : id);
}
export function moveVisibleTask(columns: Columns, id: string, status: TaskStatus, ordered?: string[]): Columns {
  const task = TASK_STATUS_ORDER.flatMap(s => columns[s]).find(t => t.id === id);
  if (!task) return columns;
  const next = { ...columns };
  for (const s of TASK_STATUS_ORDER) next[s] = columns[s].filter(t => t.id !== id);
  next[status] = [...next[status], { ...task, status }];
  if (ordered) {
    const ids = mergeTaskOrder(next[status].map(t => t.id), ordered);
    const byId = new Map(next[status].map(t => [t.id, t]));
    next[status] = ids.map(id => byId.get(id)!);
  }
  return next;
}
