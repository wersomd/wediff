"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tagsConnect, tagsReplace } from "@/features/tags/queries";
import { noteCreateSchema, noteUpdateSchema } from "./schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

export async function createNote(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = noteCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { title, content, pinned, projectId, tags } = parsed.data;
  await db.note.create({
    data: {
      title,
      content: content ?? "",
      pinned,
      projectId,
      tags: tagsConnect(tags),
    },
  });
  revalidatePath("/notes");
  return { ok: true };
}

export async function updateNote(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = noteUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, title, content, pinned, projectId, tags } = parsed.data;
  await db.note.update({
    where: { id },
    data: {
      title,
      content: content ?? "",
      pinned,
      projectId,
      tags: tagsReplace(tags),
    },
  });
  revalidatePath("/notes");
  return { ok: true };
}

export async function deleteNote(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.note.delete({ where: { id } });
  revalidatePath("/notes");
  return { ok: true };
}

export async function toggleNotePin(
  id: string,
  pinned: boolean,
): Promise<ActionResult> {
  await requireAuth();
  await db.note.update({ where: { id }, data: { pinned } });
  revalidatePath("/notes");
  return { ok: true };
}
