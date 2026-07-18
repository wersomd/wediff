"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL,
  CREATED_FILTER_LABELS,
  CREATED_FILTER_ORDER,
  DUE_FILTER_LABELS,
  DUE_FILTER_ORDER,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ORDER,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  type TaskFiltersState,
} from "../constants";
import type { ProjectOption } from "../queries";

export function TaskFilters({
  filters,
  onChange,
  projects,
  showProject,
}: {
  filters: TaskFiltersState;
  onChange: (next: TaskFiltersState) => void;
  projects: ProjectOption[];
  showProject: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v })}
      >
        <SelectTrigger className="h-9 w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Все статусы</SelectItem>
          {TASK_STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) => onChange({ ...filters, priority: v })}
      >
        <SelectTrigger className="h-9 w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Все приоритеты</SelectItem>
          {TASK_PRIORITY_ORDER.map((p) => (
            <SelectItem key={p} value={p}>
              {TASK_PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showProject && (
        <Select
          value={filters.projectId}
          onValueChange={(v) => onChange({ ...filters, projectId: v })}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все проекты</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={filters.due}
        onValueChange={(v) => onChange({ ...filters, due: v })}
      >
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Все сроки</SelectItem>
          {DUE_FILTER_ORDER.map((d) => (
            <SelectItem key={d} value={d}>
              {DUE_FILTER_LABELS[d]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.created}
        onValueChange={(v) => onChange({ ...filters, created: v })}
      >
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Создано: всё время</SelectItem>
          {CREATED_FILTER_ORDER.map((c) => (
            <SelectItem key={c} value={c}>
              Создано: {CREATED_FILTER_LABELS[c].toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
