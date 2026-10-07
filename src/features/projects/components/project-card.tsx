"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { describeDeadline } from "../progress";
import {
  DEADLINE_TONE_CLASS,
  DEFAULT_PROJECT_COLOR,
  PROJECT_STATUS_BADGE_CLASS,
  PROJECT_STATUS_LABELS,
} from "../constants";
import type { ProjectWithProgress } from "../queries";

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: ProjectWithProgress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const deadlineInfo = describeDeadline(new Date(), project.deadline);
  return (
    <div className="group relative rounded-xl border border-border border-t-[3px] border-t-primary bg-card p-5 transition-colors hover:border-foreground/20">
      <Link
        href={`/projects/${project.id}`}
        className="absolute inset-0 rounded-xl"
        aria-label={project.name}
      />
      <div className="flex items-start justify-between gap-2">
        <span
          className="mt-1 size-3 shrink-0 rounded-full"
          style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
        />
        <div className="relative z-10">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-md p-1 text-muted-foreground opacity-100 outline-none transition-opacity hover:bg-accent focus-visible:opacity-100 group-hover:opacity-100"
              aria-label="Действия"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit} className="cursor-pointer">
                <Pencil className="size-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onDelete}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h3 className="mt-3 text-lg font-semibold">{project.name}</h3>
      {project.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Badge
          variant="secondary"
          className={PROJECT_STATUS_BADGE_CLASS[project.status]}
        >
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {project.taskCount} {pluralizeTasks(project.taskCount)}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${project.progress.percent ?? 0}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {project.progress.percent === null ? "Нет задач" : `${project.progress.percent}%`}
        </span>
        <span className={cn(DEADLINE_TONE_CLASS[deadlineInfo.tone])}>
          {deadlineInfo.label}
        </span>
      </div>
    </div>
  );
}

function pluralizeTasks(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "задача";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "задачи";
  return "задач";
}
