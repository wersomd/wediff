"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderKanban, Plus } from "lucide-react";
import type { Project } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectCard } from "./project-card";
import { ProjectDialog } from "./project-dialog";
import { deleteProject } from "../actions";
import type { ProjectWithCount } from "../queries";

export function ProjectList({ projects }: { projects: ProjectWithCount[] }) {
  const router = useRouter();
  const [, startDelete] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setDialogOpen(true);
  }

  function remove(project: ProjectWithCount) {
    const count = project._count.tasks;
    const warning =
      count > 0
        ? `\n\n${count} задач(и) останутся, но потеряют привязку к проекту.`
        : "";
    if (!window.confirm(`Удалить проект «${project.name}»?${warning}`)) return;
    startDelete(async () => {
      const res = await deleteProject(project.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Проект удалён");
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Проекты"
        description="Сгруппируйте задачи по проектам и отслеживайте их статус."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Новый проект
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Пока нет проектов"
          description="Создайте первый проект, чтобы сгруппировать задачи."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => openEdit(project)}
              onDelete={() => remove(project)}
            />
          ))}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
      />
    </>
  );
}
