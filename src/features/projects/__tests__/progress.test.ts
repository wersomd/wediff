import { describe, it, expect } from "vitest";
import {
  computeProjectProgress,
  describeDeadline,
  rankProjectUrgency,
  type RankableProject,
} from "@/features/projects/progress";

describe("computeProjectProgress", () => {
  it("computes done/total/percent, excluding cancelled tasks", () => {
    const result = computeProjectProgress([
      { status: "DONE" },
      { status: "DONE" },
      { status: "TODO" },
      { status: "CANCELLED" },
    ]);
    expect(result).toEqual({ done: 2, total: 3, percent: 67 });
  });

  it("returns percent: null when there are no countable tasks", () => {
    expect(computeProjectProgress([])).toEqual({ done: 0, total: 0, percent: null });
    expect(computeProjectProgress([{ status: "CANCELLED" }])).toEqual({
      done: 0,
      total: 0,
      percent: null,
    });
  });

  it("returns 100 percent when all countable tasks are done", () => {
    const result = computeProjectProgress([{ status: "DONE" }, { status: "DONE" }]);
    expect(result).toEqual({ done: 2, total: 2, percent: 100 });
  });
});

describe("describeDeadline", () => {
  const now = new Date("2026-08-06T09:00:00");

  it("returns tone 'none' when there is no deadline", () => {
    expect(describeDeadline(now, null)).toEqual({ tone: "none", label: "Без дедлайна" });
  });

  it("returns tone 'overdue' with days-late count for a past deadline", () => {
    const result = describeDeadline(now, new Date("2026-08-01T00:00:00"));
    expect(result).toEqual({ tone: "overdue", label: "Просрочен на 5 дн." });
  });

  it("returns tone 'soon' for today's deadline", () => {
    expect(describeDeadline(now, new Date("2026-08-06T23:00:00"))).toEqual({
      tone: "soon",
      label: "Сегодня дедлайн",
    });
  });

  it("returns tone 'soon' for a deadline within 3 days", () => {
    const result = describeDeadline(now, new Date("2026-08-08T00:00:00"));
    expect(result).toEqual({ tone: "soon", label: "Осталось 2 дн." });
  });

  it("returns tone 'normal' with a formatted date for a distant deadline", () => {
    const result = describeDeadline(now, new Date("2026-09-15T00:00:00"));
    expect(result).toEqual({ tone: "normal", label: "15 сент." });
  });
});

describe("rankProjectUrgency", () => {
  const now = new Date("2026-08-06T09:00:00");

  function project(overrides: Partial<RankableProject>): RankableProject {
    return {
      id: "id",
      status: "IN_PROGRESS",
      deadline: null,
      progress: { percent: null },
      createdAt: new Date("2026-01-01"),
      ...overrides,
    };
  }

  it("sorts overdue projects before ones with future deadlines", () => {
    const overdue = project({ id: "overdue", deadline: new Date("2026-08-01") });
    const future = project({ id: "future", deadline: new Date("2026-09-01") });
    expect(rankProjectUrgency(now, [future, overdue]).map((p) => p.id)).toEqual([
      "overdue",
      "future",
    ]);
  });

  it("sorts the most overdue project first among multiple overdue projects", () => {
    const a = project({ id: "a", deadline: new Date("2026-08-04") }); // 2 days overdue
    const b = project({ id: "b", deadline: new Date("2026-07-30") }); // 7 days overdue
    expect(rankProjectUrgency(now, [a, b]).map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("puts projects without a deadline after ones with a deadline", () => {
    const withDeadline = project({ id: "with", deadline: new Date("2026-09-01") });
    const noDeadline = project({ id: "without", deadline: null });
    expect(rankProjectUrgency(now, [noDeadline, withDeadline]).map((p) => p.id)).toEqual([
      "with",
      "without",
    ]);
  });

  it("breaks ties on equal deadline urgency by higher progress first", () => {
    const lowProgress = project({
      id: "low",
      deadline: new Date("2026-09-01"),
      progress: { percent: 10 },
    });
    const highProgress = project({
      id: "high",
      deadline: new Date("2026-09-01"),
      progress: { percent: 90 },
    });
    expect(rankProjectUrgency(now, [lowProgress, highProgress]).map((p) => p.id)).toEqual([
      "high",
      "low",
    ]);
  });

  it("moves DONE and ARCHIVED projects to the end, after all active projects", () => {
    const done = project({ id: "done", status: "DONE", deadline: new Date("2026-08-01") });
    const archived = project({ id: "archived", status: "ARCHIVED" });
    const active = project({ id: "active", deadline: new Date("2026-12-01") });
    expect(rankProjectUrgency(now, [done, archived, active]).map((p) => p.id)).toEqual([
      "active",
      "done",
      "archived",
    ]);
  });
});

import { describeProjectDeadline } from "../progress";
it("uses Almaty day and suppresses closed-project warnings", () => {
 const now = new Date("2026-10-08T19:01:00Z");
 expect(describeProjectDeadline(now, new Date("2026-10-08T00:00:00Z"), "IN_PROGRESS").tone).toBe("overdue");
 expect(describeProjectDeadline(now, new Date("2026-10-08T00:00:00Z"), "DONE").tone).toBe("normal");
 expect(describeProjectDeadline(now, new Date("2026-10-08T00:00:00Z"), "ARCHIVED").tone).toBe("normal");
});
