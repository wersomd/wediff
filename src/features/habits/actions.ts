"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  habitCreateSchema,
  habitUpdateSchema,
  toggleEntrySchema,
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

export async function createHabit(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = habitCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { name, description, color, icon, frequency, target } = parsed.data;
  await db.habit.create({
    data: {
      name,
      description: clean(description),
      color: clean(color),
      icon: clean(icon),
      frequency,
      target,
    },
  });
  revalidatePath("/habits");
  return { ok: true };
}

export async function updateHabit(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = habitUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, name, description, color, icon, frequency, target } = parsed.data;
  await db.habit.update({
    where: { id },
    data: {
      name,
      description: clean(description),
      color: clean(color),
      icon: clean(icon),
      frequency,
      target,
    },
  });
  revalidatePath("/habits");
  return { ok: true };
}

export async function deleteHabit(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.habit.delete({ where: { id } });
  revalidatePath("/habits");
  return { ok: true };
}

export async function setHabitArchived(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  await requireAuth();
  await db.habit.update({ where: { id }, data: { archived } });
  revalidatePath("/habits");
  return { ok: true };
}

// Toggle a habit's completion for one day: create the entry if missing, delete
// it if present. Date is the local day key (YYYY-MM-DD), stored at UTC midnight.
export async function toggleHabitEntry(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = toggleEntrySchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректная отметка" };
  const { habitId, date } = parsed.data;
  const day = new Date(`${date}T00:00:00.000Z`);

  const existing = await db.habitEntry.findUnique({
    where: { habitId_date: { habitId, date: day } },
    select: { id: true },
  });
  if (existing) {
    await db.habitEntry.delete({ where: { id: existing.id } });
  } else {
    await db.habitEntry.create({ data: { habitId, date: day } });
  }
  revalidatePath("/habits");
  return { ok: true };
}
