import "server-only";
import { db } from "@/lib/db";

// Notes for the grid: pinned first, then most-recently updated. Includes tags
// and the linked project (name + color) for chips.
export async function getNotes() {
  return db.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: {
      tags: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, color: true } },
    },
  });
}

export type NoteWithRelations = Awaited<ReturnType<typeof getNotes>>[number];

// Active projects for the note's project picker.
export async function getNoteProjects() {
  return db.project.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}

export type NoteProjectOption = Awaited<
  ReturnType<typeof getNoteProjects>
>[number];
