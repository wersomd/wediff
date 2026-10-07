"use server";

import { revalidatePath } from "next/cache";
import { localEventTime } from "@/lib/workspace-date";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calendarEventCreateSchema, calendarEventUpdateSchema } from "./schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

function revalidateCalendar() {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function createCalendarEvent(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = calendarEventCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { title, date, time, note } = parsed.data;
  await db.calendarEvent.create({
    data: { title, note: clean(note), startAt: localEventTime(date, time) },
  });
  revalidateCalendar();
  return { ok: true };
}

export async function updateCalendarEvent(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = calendarEventUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, title, date, time, note } = parsed.data;
  await db.calendarEvent.update({
    where: { id },
    data: { title, note: clean(note), startAt: localEventTime(date, time) },
  });
  revalidateCalendar();
  return { ok: true };
}

export async function deleteCalendarEvent(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.calendarEvent.delete({ where: { id } });
  revalidateCalendar();
  return { ok: true };
}
