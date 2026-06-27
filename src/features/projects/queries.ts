import "server-only";
import { db } from "@/lib/db";

// Projects for the list page: each with a live count of its tasks.
export async function getProjects() {
  return db.project.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { tasks: true } } },
  });
}

export type ProjectWithCount = Awaited<ReturnType<typeof getProjects>>[number];

// A single project for its detail page. Returns null when not found so the
// page can call notFound().
export async function getProject(id: string) {
  return db.project.findUnique({ where: { id } });
}
