"use server";

import { revalidatePath } from "next/cache";
import { GoalStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  goalCreateSchema,
  goalUpdateSchema,
  keyResultCreateSchema,
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

function revalidateGoals() {
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

function toDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export async function createGoal(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = goalCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { title, description, targetValue, currentValue, unit, dueDate } =
    parsed.data;
  await db.goal.create({
    data: {
      title,
      description: clean(description),
      targetValue: targetValue ?? null,
      currentValue: currentValue ?? 0,
      unit: clean(unit),
      dueDate: toDate(dueDate),
    },
  });
  revalidateGoals();
  return { ok: true };
}

export async function updateGoal(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = goalUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, title, description, targetValue, currentValue, unit, dueDate } =
    parsed.data;
  await db.goal.update({
    where: { id },
    data: {
      title,
      description: clean(description),
      targetValue: targetValue ?? null,
      currentValue: currentValue ?? 0,
      unit: clean(unit),
      dueDate: toDate(dueDate),
    },
  });
  revalidateGoals();
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.goal.delete({ where: { id } });
  revalidateGoals();
  return { ok: true };
}

export async function setGoalStatus(
  id: string,
  status: GoalStatus,
): Promise<ActionResult> {
  await requireAuth();
  await db.goal.update({ where: { id }, data: { status } });
  revalidateGoals();
  return { ok: true };
}

// Quick numeric progress bump (e.g. "+1 книга" or set an exact value).
export async function setGoalProgress(
  id: string,
  value: number,
): Promise<ActionResult> {
  await requireAuth();
  if (!Number.isFinite(value) || value < 0) {
    return { error: "Некорректное значение" };
  }
  const goal = await db.goal.update({
    where: { id },
    data: { currentValue: value },
    select: { targetValue: true },
  });
  // Auto-complete when a numeric target is reached.
  if (goal.targetValue && value >= goal.targetValue.toNumber()) {
    await db.goal.update({ where: { id }, data: { status: GoalStatus.DONE } });
  }
  revalidateGoals();
  return { ok: true };
}

export async function addKeyResult(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = keyResultCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { goalId, title } = parsed.data;
  const count = await db.goalKeyResult.count({ where: { goalId } });
  await db.goalKeyResult.create({
    data: { goalId, title, order: count },
  });
  revalidateGoals();
  return { ok: true };
}

export async function toggleKeyResult(
  id: string,
  done: boolean,
): Promise<ActionResult> {
  await requireAuth();
  await db.goalKeyResult.update({ where: { id }, data: { done } });
  revalidateGoals();
  return { ok: true };
}

export async function deleteKeyResult(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.goalKeyResult.delete({ where: { id } });
  revalidateGoals();
  return { ok: true };
}
