import "server-only";
import { db } from "@/lib/db";

export type Breadcrumb = { id: string; name: string };

// Contents of one folder: its subfolders, its files, and the breadcrumb path
// from the root down to it. folderId === null is the root.
export async function getFolderContents(folderId: string | null) {
  const [folders, files, current] = await Promise.all([
    db.folder.findMany({
      where: { parentId: folderId },
      orderBy: { name: "asc" },
      include: { _count: { select: { files: true, children: true } } },
    }),
    db.fileObject.findMany({
      where: { folderId },
      orderBy: { createdAt: "desc" },
    }),
    folderId ? db.folder.findUnique({ where: { id: folderId } }) : null,
  ]);

  const breadcrumbs: Breadcrumb[] = [];
  let cursor = current;
  while (cursor) {
    breadcrumbs.unshift({ id: cursor.id, name: cursor.name });
    cursor = cursor.parentId
      ? await db.folder.findUnique({ where: { id: cursor.parentId } })
      : null;
  }

  return { folders, files, breadcrumbs, currentId: folderId };
}

export type FolderEntry = Awaited<
  ReturnType<typeof getFolderContents>
>["folders"][number];
export type FileEntry = Awaited<
  ReturnType<typeof getFolderContents>
>["files"][number];
