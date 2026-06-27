import "server-only";
import { db } from "@/lib/db";

// Bookmarks for the grid: newest first, with tags.
export async function getBookmarks() {
  return db.bookmark.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: { select: { id: true, name: true } } },
  });
}

export type BookmarkWithTags = Awaited<ReturnType<typeof getBookmarks>>[number];
