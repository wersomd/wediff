"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ALL,
  DEFAULT_TASK_SORT,
  DEFAULT_TASK_VIEW,
  TASK_SORT_ORDER,
  type TaskFiltersState,
  type TaskSort,
} from "./constants";
import { resolveTaskView } from "./board-state";
import type { TaskView } from "./components/view-switcher";

// Filter/sort/view state lives in the URL query string (like Jira/Notion): the
// selection survives a refresh, the back button, and can be shared as a link.
// The server never reads these — they only drive client-side filtering — so a
// shallow `router.replace` (no scroll reset) is enough.

const FILTER_KEYS: Record<keyof TaskFiltersState, string> = {
  status: "status",
  priority: "priority",
  projectId: "project",
  due: "due",
  created: "created",
  query: "q",
};

function readSort(raw: string | null): TaskSort {
  return (TASK_SORT_ORDER as readonly string[]).includes(raw ?? "")
    ? (raw as TaskSort)
    : DEFAULT_TASK_SORT;
}

export function useTaskView() {

  const pathname = usePathname();
  const params = useSearchParams();

  const view: TaskView = resolveTaskView(params.get("view"));

  const filters: TaskFiltersState = useMemo(
    () => ({
      status: params.get(FILTER_KEYS.status) ?? ALL,
      priority: params.get(FILTER_KEYS.priority) ?? ALL,
      projectId: params.get(FILTER_KEYS.projectId) ?? ALL,
      due: params.get(FILTER_KEYS.due) ?? ALL,
      created: params.get(FILTER_KEYS.created) ?? ALL,
      query: params.get("q") ?? "",
    }),
    [params],
  );

  const sort = readSort(params.get("sort"));

  // Default values are dropped from the URL so a pristine view has a clean path.
  const commit = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      const qs = next.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname],
  );

  const setView = useCallback(
    (v: TaskView) =>
      commit((p) => {
        if (v === DEFAULT_TASK_VIEW) p.delete("view");
        else p.set("view", v);
      }),
    [commit],
  );

  const setFilters = useCallback(
    (nextFilters: TaskFiltersState) =>
      commit((p) => {
        for (const key of Object.keys(FILTER_KEYS) as (keyof TaskFiltersState)[]) {
          const value = nextFilters[key];
          if (!value || value === ALL) p.delete(FILTER_KEYS[key]);
          else p.set(FILTER_KEYS[key], value);
        }
      }),
    [commit],
  );

  const setSort = useCallback(
    (s: TaskSort) =>
      commit((p) => {
        if (s === DEFAULT_TASK_SORT) p.delete("sort");
        else p.set("sort", s);
      }),
    [commit],
  );

  const reset = useCallback(
    () =>
      commit((p) => {
        Object.values(FILTER_KEYS).forEach((k) => p.delete(k));
        p.delete("sort");
      }),
    [commit],
  );

  const isFiltered =
    sort !== DEFAULT_TASK_SORT ||
    Object.values(filters).some((v) => Boolean(v) && v !== ALL);

  return { view, filters, sort, isFiltered, setView, setFilters, setSort, reset };
}
