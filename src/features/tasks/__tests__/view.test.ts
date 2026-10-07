import { describe, expect, it } from "vitest";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { ALL, type TaskFiltersState } from "../constants";
import { applyTaskView, matchesFilters, sortTasks } from "../view";
import type { TaskWithProject } from "../queries";

const NO_FILTERS: TaskFiltersState = {
  status: ALL,
  priority: ALL,
  projectId: ALL,
  due: ALL,
  created: ALL,
};

function task(over: Partial<TaskWithProject>): TaskWithProject {
  return {
    id: Math.random().toString(36).slice(2),
    title: "t",
    description: null,
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    completedAt: null,
    order: 0,
    projectId: null,
    project: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...over,
  } as TaskWithProject;
}

describe("sortTasks", () => {
  it("keeps input order for manual", () => {
    const a = task({ title: "a" });
    const b = task({ title: "b" });
    expect(sortTasks([b, a], "manual")).toEqual([b, a]);
  });

  it("orders by priority URGENT → LOW", () => {
    const low = task({ priority: TaskPriority.LOW });
    const urgent = task({ priority: TaskPriority.URGENT });
    const med = task({ priority: TaskPriority.MEDIUM });
    expect(sortTasks([low, urgent, med], "priority")).toEqual([urgent, med, low]);
  });

  it("orders by due date, nulls last", () => {
    const soon = task({ dueDate: new Date("2026-02-01") });
    const later = task({ dueDate: new Date("2026-03-01") });
    const none = task({ dueDate: null });
    expect(sortTasks([none, later, soon], "due")).toEqual([soon, later, none]);
  });

  it("orders by created date, newest first", () => {
    const older = task({ createdAt: new Date("2026-01-01") });
    const newer = task({ createdAt: new Date("2026-06-01") });
    expect(sortTasks([older, newer], "created")).toEqual([newer, older]);
  });

  it("does not mutate the input array", () => {
    const input = [
      task({ priority: TaskPriority.LOW }),
      task({ priority: TaskPriority.URGENT }),
    ];
    const snapshot = [...input];
    sortTasks(input, "priority");
    expect(input).toEqual(snapshot);
  });
});

describe("matchesFilters", () => {
  const now = new Date("2026-06-15");

  it("passes everything when no filter is set", () => {
    expect(matchesFilters(task({}), NO_FILTERS, now)).toBe(true);
  });

  it("filters by status", () => {
    const t = task({ status: TaskStatus.REVIEW });
    expect(
      matchesFilters(t, { ...NO_FILTERS, status: TaskStatus.REVIEW }, now),
    ).toBe(true);
    expect(
      matchesFilters(t, { ...NO_FILTERS, status: TaskStatus.TODO }, now),
    ).toBe(false);
  });

  it("filters by overdue due-bucket", () => {
    const overdue = task({ dueDate: new Date("2026-06-01") });
    const future = task({ dueDate: new Date("2026-07-01") });
    expect(matchesFilters(overdue, { ...NO_FILTERS, due: "OVERDUE" }, now)).toBe(
      true,
    );
    expect(matchesFilters(future, { ...NO_FILTERS, due: "OVERDUE" }, now)).toBe(
      false,
    );
  });
});

describe("applyTaskView", () => {
  it("filters then sorts", () => {
    const now = new Date("2026-06-15");
    const keep1 = task({ priority: TaskPriority.LOW, status: TaskStatus.TODO });
    const keep2 = task({ priority: TaskPriority.URGENT, status: TaskStatus.TODO });
    const drop = task({ status: TaskStatus.DONE });
    const out = applyTaskView(
      [keep1, drop, keep2],
      { ...NO_FILTERS, status: TaskStatus.TODO },
      "priority",
      now,
    );
    expect(out).toEqual([keep2, keep1]);
  });
});

describe("workspace selection", () => {
  const now = new Date("2026-10-06T20:00:00Z");
  it("includes review and paused tasks in open selection and excludes terminal states", () => {
    for (const status of [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.ON_HOLD]) {
      expect(matchesFilters(task({ status }), { ...NO_FILTERS, status: "OPEN" }, now)).toBe(true);
    }
    for (const status of [TaskStatus.DONE, TaskStatus.CANCELLED]) {
      expect(matchesFilters(task({ status }), { ...NO_FILTERS, status: "OPEN" }, now)).toBe(false);
    }
  });
  it("uses a seven-day window starting with today in Almaty", () => {
    const filters = { ...NO_FILTERS, due: "WEEK" };
    expect(matchesFilters(task({ dueDate: new Date("2026-10-07") }), filters, now)).toBe(true);
    expect(matchesFilters(task({ dueDate: new Date("2026-10-13") }), filters, now)).toBe(true);
    expect(matchesFilters(task({ dueDate: new Date("2026-10-14") }), filters, now)).toBe(false);
    expect(matchesFilters(task({ dueDate: new Date("2026-10-06") }), filters, now)).toBe(false);
    expect(matchesFilters(task({ dueDate: null }), filters, now)).toBe(false);
  });
  it("combines normalized title search with status and due filters", () => {
    const filters = { ...NO_FILTERS, status: "OPEN", due: "TODAY", query: "  СЕРВИС  " };
    expect(matchesFilters(task({ title: "Оплатить сервис", dueDate: new Date("2026-10-07") }), filters, now)).toBe(true);
    expect(matchesFilters(task({ title: "Другая задача", dueDate: new Date("2026-10-07") }), filters, now)).toBe(false);
    expect(matchesFilters(task({ title: "Оплатить сервис", status: TaskStatus.DONE, dueDate: new Date("2026-10-07") }), filters, now)).toBe(false);
  });
});
