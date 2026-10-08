"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import type { Project, ProjectStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { setProjectStatus } from "../actions";
import { describeProjectDeadline, type ProjectProgress } from "../progress";
import {
  DEADLINE_TONE_CLASS,
  DEFAULT_PROJECT_COLOR,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ORDER,
} from "../constants";
import { ProjectDialog } from "./project-dialog";

export function ProjectDetailHeader({
  project,
  progress,
}: {
  project: Project;
  progress: ProjectProgress;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const deadlineInfo = describeProjectDeadline(new Date(), project.deadline, project.status);

  function onStatusChange(value: string) {
    start(async () => {
      const res = await setProjectStatus(project.id, value as ProjectStatus);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="size-4 shrink-0 rounded-full"
          style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
        />
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>

        <Select value={project.status} onValueChange={onStatusChange} disabled={pending}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" onClick={() => setDialogOpen(true)} aria-label="Редактировать проект">
          <Pencil className="size-4" />
        </Button>
      </div>

      {project.description && (
        <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="mt-4 max-w-sm">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress.percent ?? 0}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {progress.percent === null
              ? "Нет задач"
              : `${progress.percent}% (${progress.done}/${progress.total})`}
          </span>
          <span className={cn(DEADLINE_TONE_CLASS[deadlineInfo.tone])}>
            {deadlineInfo.label}
          </span>
        </div>
      </div>

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} project={project} />
    </div>
  );
}
