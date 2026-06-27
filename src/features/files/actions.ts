"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

// ── Folders ───────────────────────────────────────────────────────────────
export async function createFolder(
  name: string,
  parentId: string | null,
): Promise<ActionResult> {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Введите название" };
  await db.folder.create({
    data: { name: trimmed.slice(0, 120), parentId: parentId || null },
  });
  revalidatePath("/files");
  return { ok: true };
}

export async function renameFolder(
  id: string,
  name: string,
): Promise<ActionResult> {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Введите название" };
  await db.folder.update({ where: { id }, data: { name: trimmed.slice(0, 120) } });
  revalidatePath("/files");
  return { ok: true };
}

// Delete a folder and everything under it: collect the subtree, remove all
// contained files from storage + DB, then delete the folder (subfolders cascade).
export async function deleteFolder(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };

  const folderIds = [id];
  let frontier = [id];
  while (frontier.length) {
    const children = await db.folder.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    const ids = children.map((c) => c.id);
    folderIds.push(...ids);
    frontier = ids;
  }

  const files = await db.fileObject.findMany({
    where: { folderId: { in: folderIds } },
    select: { id: true, storageKey: true },
  });
  const storage = getStorage();
  for (const f of files) {
    try {
      await storage.remove(f.storageKey);
    } catch {
      // best-effort: keep going so DB stays consistent
    }
  }
  if (files.length) {
    await db.fileObject.deleteMany({
      where: { id: { in: files.map((f) => f.id) } },
    });
  }
  await db.folder.delete({ where: { id } });
  revalidatePath("/files");
  return { ok: true };
}

// ── Files ─────────────────────────────────────────────────────────────────
export async function uploadFile(formData: FormData): Promise<ActionResult> {
  await requireAuth();
  const file = formData.get("file");
  const folderId = (formData.get("folderId") as string) || null;
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Файл больше 50 МБ" };
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 200);
  const key = `${folderId ?? "root"}/${randomUUID()}-${safeName}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  try {
    await getStorage().upload(key, buffer, file.type || "application/octet-stream");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Загрузка не удалась" };
  }

  await db.fileObject.create({
    data: {
      name: file.name.slice(0, 200),
      storageKey: key,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      folderId,
    },
  });
  revalidatePath("/files");
  return { ok: true };
}

export async function deleteFile(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  const file = await db.fileObject.findUnique({
    where: { id },
    select: { storageKey: true },
  });
  if (!file) return { error: "Файл не найден" };
  try {
    await getStorage().remove(file.storageKey);
  } catch {
    // best-effort
  }
  await db.fileObject.delete({ where: { id } });
  revalidatePath("/files");
  return { ok: true };
}

// Returns a short-lived signed URL for opening/downloading a file.
export async function getFileUrl(
  id: string,
): Promise<{ url: string } | { error: string }> {
  await requireAuth();
  const file = await db.fileObject.findUnique({
    where: { id },
    select: { storageKey: true },
  });
  if (!file) return { error: "Файл не найден" };
  try {
    return { url: await getStorage().getUrl(file.storageKey) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка ссылки" };
  }
}
