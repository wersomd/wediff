"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tagsConnect, tagsReplace } from "@/features/tags/queries";
import { bookmarkCreateSchema, bookmarkUpdateSchema } from "./schema";
import { deriveBookmarkMeta } from "./meta";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

export async function createBookmark(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = bookmarkCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { url, title, description, isArchived, tags } = parsed.data;
  const meta = deriveBookmarkMeta(url);
  await db.bookmark.create({
    data: {
      url,
      title: clean(title) ?? meta.defaultTitle,
      description: clean(description),
      type: meta.type,
      thumbnailUrl: meta.thumbnailUrl,
      faviconUrl: meta.faviconUrl,
      isArchived,
      tags: tagsConnect(tags),
    },
  });
  revalidatePath("/links");
  return { ok: true };
}

export async function updateBookmark(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = bookmarkUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, url, title, description, isArchived, tags } = parsed.data;
  const meta = deriveBookmarkMeta(url);
  await db.bookmark.update({
    where: { id },
    data: {
      url,
      title: clean(title) ?? meta.defaultTitle,
      description: clean(description),
      type: meta.type,
      thumbnailUrl: meta.thumbnailUrl,
      faviconUrl: meta.faviconUrl,
      isArchived,
      tags: tagsReplace(tags),
    },
  });
  revalidatePath("/links");
  return { ok: true };
}

export async function deleteBookmark(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.bookmark.delete({ where: { id } });
  revalidatePath("/links");
  return { ok: true };
}

export async function toggleBookmarkArchive(
  id: string,
  isArchived: boolean,
): Promise<ActionResult> {
  await requireAuth();
  await db.bookmark.update({ where: { id }, data: { isArchived } });
  revalidatePath("/links");
  return { ok: true };
}
