import "server-only";
import { db } from "@/lib/db";

// All tags (shared by notes + bookmarks) for autocomplete and filters.
export async function getTags() {
  return db.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}

export type TagOption = Awaited<ReturnType<typeof getTags>>[number];

// Prisma `connectOrCreate` fragment for tags by name (use on create).
export function tagsConnect(names: string[]) {
  const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  return {
    connectOrCreate: unique.map((name) => ({
      where: { name },
      create: { name },
    })),
  };
}

// Same, plus `set: []` to replace a record's existing tags (use on update).
export function tagsReplace(names: string[]) {
  return { set: [], ...tagsConnect(names) };
}
