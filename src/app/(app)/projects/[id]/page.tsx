import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TasksView } from "@/features/tasks/components/tasks-view";
import { getTasks, getProjectsForPicker } from "@/features/tasks/queries";
import { getProject } from "@/features/projects/queries";
import {
  DEFAULT_PROJECT_COLOR,
  PROJECT_STATUS_LABELS,
} from "@/features/projects/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  return { title: project ? project.name : "Проект" };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [tasks, projects] = await Promise.all([
    getTasks(id),
    getProjectsForPicker(),
  ]);

  return (
    <>
      <div className="mb-6">
        <Link
          href="/projects"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Все проекты
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="size-4 shrink-0 rounded-full"
            style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <Badge variant="secondary">
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
        {project.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>

      <TasksView initialTasks={tasks} projects={projects} lockedProjectId={id} />
    </>
  );
}
