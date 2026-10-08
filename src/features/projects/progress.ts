import { format } from "date-fns";
import { daysFromToday } from "@/lib/workspace-date";
import { ru } from "date-fns/locale";

export type TaskStatusLike =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "ON_HOLD"
  | "DONE"
  | "CANCELLED";

export type ProjectStatusLike =
  | "PLANNING"
  | "IN_PROGRESS"
  | "REVIEW"
  | "ON_HOLD"
  | "DONE"
  | "ARCHIVED";

export interface ProjectProgress {
  done: number;
  total: number; // excludes cancelled tasks
  percent: number | null; // null when there are no countable tasks
}

export function computeProjectProgress(tasks: { status: TaskStatusLike }[]): ProjectProgress {
  const counted = tasks.filter((t) => t.status !== "CANCELLED");
  const done = counted.filter((t) => t.status === "DONE").length;
  const total = counted.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : null };
}

export type DeadlineTone = "overdue" | "soon" | "normal" | "none";

export interface DeadlineInfo {
  tone: DeadlineTone;
  label: string;
}

// Deadline copy: overdue/soon buckets are actionable, distant deadlines just
// show a date. Days phrasing intentionally stays "N дн." (unpluralized),
// matching existing dashboard widgets (e.g. subscriptions' "N дн.").
export function describeDeadline(now: Date, deadline: Date | null): DeadlineInfo {
  if (!deadline) return { tone: "none", label: "Без дедлайна" };
  const days = daysFromToday(deadline, now);
  if (days < 0) return { tone: "overdue", label: `Просрочен на ${Math.abs(days)} дн.` };
  if (days === 0) return { tone: "soon", label: "Сегодня дедлайн" };
  if (days <= 3) return { tone: "soon", label: `Осталось ${days} дн.` };
  return { tone: "normal", label: format(deadline, "d MMM", { locale: ru }) };
}

const TERMINAL_STATUSES = new Set<ProjectStatusLike>(["DONE", "ARCHIVED"]);

export interface RankableProject {
  id: string;
  status: ProjectStatusLike;
  deadline: Date | null;
  progress: { percent: number | null };
  createdAt: Date;
}

function compareUrgency(a: RankableProject, b: RankableProject, now: Date): number {
  const aDays = a.deadline ? daysFromToday(a.deadline, now) : null;
  const bDays = b.deadline ? daysFromToday(b.deadline, now) : null;

  if (aDays !== null && bDays !== null && aDays !== bDays) return aDays - bDays;
  if (aDays !== null && bDays === null) return -1;
  if (aDays === null && bDays !== null) return 1;

  const aPct = a.progress.percent ?? -1;
  const bPct = b.progress.percent ?? -1;
  if (aPct !== bPct) return bPct - aPct;

  return b.createdAt.getTime() - a.createdAt.getTime();
}

// Ranks active projects by urgency (most overdue first, then soonest
// deadline, no-deadline last, ties broken by progress then recency).
// DONE/ARCHIVED projects are pushed to the end, in their original order.
export function rankProjectUrgency<T extends RankableProject>(now: Date, projects: T[]): T[] {
  const active: T[] = [];
  const terminal: T[] = [];
  for (const p of projects) {
    (TERMINAL_STATUSES.has(p.status) ? terminal : active).push(p);
  }
  active.sort((a, b) => compareUrgency(a, b, now));
  return [...active, ...terminal];
}

export function describeProjectDeadline(now: Date, deadline: Date | null, status: ProjectStatusLike): DeadlineInfo {
  if (status === "DONE" || status === "ARCHIVED") return { tone: "normal", label: status === "DONE" ? "Завершён" : "В архиве" };
  return describeDeadline(now, deadline);
}
