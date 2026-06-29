"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalSaveSchema } from "./schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function revalidateJournal() {
  revalidatePath("/journal");
  revalidatePath("/dashboard");
}

// Saves a day's entry. When no id is given we upsert by date so there is at
// most one entry per day; editing an existing entry updates it by id.
export async function saveJournalEntry(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = journalSaveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, date, mood, content } = parsed.data;
  const day = new Date(`${date}T00:00:00.000Z`);
  const data = { mood: mood ?? null, content: content?.trim() ?? "" };

  if (id) {
    await db.journalEntry.update({ where: { id }, data: { date: day, ...data } });
  } else {
    await db.journalEntry.upsert({
      where: { date: day },
      create: { date: day, ...data },
      update: data,
    });
  }
  revalidateJournal();
  return { ok: true };
}

export async function deleteJournalEntry(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.journalEntry.delete({ where: { id } });
  revalidateJournal();
  return { ok: true };
}
