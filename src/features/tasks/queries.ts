import "server-only";
import { db } from "@/lib/db";

const projectSelect = { select: { id: true, name: true, color: true } } as const;

// Tasks for the board/list. Optionally scoped to one project. Ordered by the
// per-column `order` first so the board renders cards in the right sequence.
export async function getTasks(projectId?: string) {
  return db.task.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { project: projectSelect },
  });
}

export type TaskWithProject = Awaited<ReturnType<typeof getTasks>>[number];

// Lightweight project list for the task dialog's project picker.
export async function getProjectsForPicker() {
  return db.project.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}

export type ProjectOption = Awaited<
  ReturnType<typeof getProjectsForPicker>
>[number];
