"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logSaveSchema, metricCreateSchema, metricUpdateSchema } from "./schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

function revalidateHealth() {
  revalidatePath("/health");
}

export async function createMetric(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = metricCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { name, unit, icon, target } = parsed.data;
  const exists = await db.healthMetric.findUnique({ where: { name } });
  if (exists) return { error: "Метрика с таким названием уже есть" };
  await db.healthMetric.create({
    data: { name, unit: clean(unit), icon: clean(icon), target: target ?? null },
  });
  revalidateHealth();
  return { ok: true };
}

export async function updateMetric(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = metricUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, name, unit, icon, target } = parsed.data;
  await db.healthMetric.update({
    where: { id },
    data: { name, unit: clean(unit), icon: clean(icon), target: target ?? null },
  });
  revalidateHealth();
  return { ok: true };
}

export async function deleteMetric(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.healthMetric.delete({ where: { id } }); // logs cascade
  revalidateHealth();
  return { ok: true };
}

export async function setMetricArchived(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  await requireAuth();
  await db.healthMetric.update({ where: { id }, data: { archived } });
  revalidateHealth();
  return { ok: true };
}

// One value per metric per day → upsert on (metricId, date).
export async function saveLog(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = logSaveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { metricId, date, value, note } = parsed.data;
  const day = new Date(`${date}T00:00:00.000Z`);
  await db.healthLog.upsert({
    where: { metricId_date: { metricId, date: day } },
    create: { metricId, date: day, value, note: clean(note) },
    update: { value, note: clean(note) },
  });
  revalidateHealth();
  return { ok: true };
}

export async function deleteLog(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.healthLog.delete({ where: { id } });
  revalidateHealth();
  return { ok: true };
}
