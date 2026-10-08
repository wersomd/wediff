import "server-only";
import { daysFromToday } from "@/lib/workspace-date";
import { ProjectStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { computeProjectProgress, rankProjectUrgency } from "./progress";

// Projects for the list/dashboard views: each with a computed task-completion
// progress. Tasks are fetched status-only and discarded after computing
// progress — callers don't need the raw task list.
export async function getProjects() {
  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { tasks: { select: { status: true, dueDate: true } } },
  });
  return projects.map(({ tasks, ...project }) => ({
    ...project,
    taskCount: tasks.length,
    overdueTaskCount: ["DONE", "ARCHIVED"].includes(project.status) ? 0 : tasks.filter(t => !["DONE", "CANCELLED"].includes(t.status) && t.dueDate && daysFromToday(t.dueDate) < 0).length,
    progress: computeProjectProgress(tasks),
  }));
}

export type ProjectWithProgress = Awaited<ReturnType<typeof getProjects>>[number];

// Top N non-terminal projects (excludes DONE/ARCHIVED), ranked by urgency —
// used by the Dashboard's "Горящие проекты" widget.
export async function getHotProjects(limit = 4): Promise<ProjectWithProgress[]> {
  const projects = await getProjects();
  const active = projects.filter(
    (p) => p.status !== ProjectStatus.DONE && p.status !== ProjectStatus.ARCHIVED,
  );
  return rankProjectUrgency(new Date(), active).slice(0, limit);
}

// A single project for its detail page. Returns null when not found so the
// page can call notFound().
export async function getProject(id: string) {
  return db.project.findUnique({ where: { id } });
}
