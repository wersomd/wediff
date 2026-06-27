"use server";

import { revalidatePath } from "next/cache";
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

  const moved = await db.task.findUnique({
    where: { id: taskId },
    select: { completedAt: true },
  });
  if (!moved) return { error: "Задача не найдена" };

  await db.$transaction([
    // Rewrite order for every card in the target column.
    ...orderedIds.map((id, index) =>
      db.task.update({ where: { id }, data: { order: index } }),
    ),
    // Set the moved card's status + completedAt.
    db.task.update({
      where: { id: taskId },
      data: {
        status: toStatus,
        completedAt:
          toStatus === TaskStatus.DONE
            ? (moved.completedAt ?? new Date())
            : null,
      },
    }),
  ]);
  revalidateTaskViews();
  return { ok: true };
}
