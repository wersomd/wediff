"use server";

import { revalidatePath } from "next/cache";
import { mergeTaskOrder } from "./board-state";
import { TaskStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  moveTaskSchema,
  taskCreateSchema,
  taskUpdateSchema,
} from "./schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

function revalidateTaskViews() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/projects", "layout");
}

// Next free slot at the bottom of a status column.
async function nextOrder(status: TaskStatus): Promise<number> {
  const last = await db.task.findFirst({
    where: { status },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

export async function createTask(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = taskCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { title, description, status, priority, dueDate, projectId } =
    parsed.data;
  await db.task.create({
    data: {
      title,
      description: clean(description),
      status,
      priority,
      dueDate,
      projectId,
      order: await nextOrder(status),
      completedAt: status === TaskStatus.DONE ? new Date() : null,
    },
  });
  revalidateTaskViews();
  return { ok: true };
}

export async function updateTask(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = taskUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, title, description, status, priority, dueDate, projectId } =
    parsed.data;
  const current = await db.task.findUnique({
    where: { id },
    select: { status: true, completedAt: true, order: true },
  });
  if (!current) return { error: "Задача не найдена" };

  // If the status changed via the dialog, drop the task at the bottom of its
  // new column and reconcile completedAt.
  const statusChanged = current.status !== status;
  await db.task.update({
    where: { id },
    data: {
      title,
      description: clean(description),
      status,
      priority,
      dueDate,
      projectId,
      order: statusChanged ? await nextOrder(status) : current.order,
      completedAt:
        status === TaskStatus.DONE
          ? (current.completedAt ?? new Date())
          : null,
    },
  });
  revalidateTaskViews();
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.task.delete({ where: { id } });
  revalidateTaskViews();
  return { ok: true };
}

// List checkbox: flip DONE <-> TODO and reconcile completedAt.
export async function toggleDone(
  id: string,
  done: boolean,
): Promise<ActionResult> {
  await requireAuth();
  const status = done ? TaskStatus.DONE : TaskStatus.TODO;
  await db.task.update({
    where: { id },
    data: {
      status,
      order: await nextOrder(status),
      completedAt: done ? new Date() : null,
    },
  });
  revalidateTaskViews();
  return { ok: true };
}

// Board drag: persist the new column + the new ordering of that column.
export async function moveTask(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректное перемещение" };
  const { taskId, toStatus, orderedIds } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const moved = await tx.task.findUnique({ where: { id: taskId } });
      if (!moved) throw new Error("Задача не найдена");
      const target = await tx.task.findMany({ where: { status: toStatus }, orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true } });
      const all = target.map(t => t.id);
      if (!all.includes(taskId)) all.push(taskId);
      if (orderedIds && !orderedIds.includes(taskId)) throw new Error("Некорректный порядок");
      const ids = orderedIds ? mergeTaskOrder(all, orderedIds) : [...all.filter(id => id !== taskId), taskId];
      for (const [order, id] of ids.entries()) await tx.task.update({ where: { id }, data: { order } });
      await tx.task.update({ where: { id: taskId }, data: {
        status: toStatus,
        completedAt: toStatus === TaskStatus.DONE ? (moved.completedAt ?? new Date()) : null,
      } });
    }, { isolationLevel: "Serializable" });
  } catch {
    return { error: "Не удалось переместить задачу. Обновите доску и попробуйте ещё раз." };
  }
  revalidateTaskViews();
  return { ok: true };
}
