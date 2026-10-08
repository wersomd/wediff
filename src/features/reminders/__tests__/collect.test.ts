import { expect, it } from "vitest";
import { collectReminders } from "../collect";
import { formatDigest } from "../format";
import { DEFAULT_REMINDER_SETTINGS, reminderSettingsSchema } from "../schema";
const now = new Date("2026-10-08T19:01:00Z");
const task = { id: "t", title: "Задача", dueDate: new Date("2026-10-08"), status: "TODO" };
it("honours Almaty dates, stages, categories and individual payment windows", () => {
 const project = { id: "p", name: "Проект", deadline: new Date("2026-10-12"), status: "IN_PROGRESS" };
 const payment = { id: "s", kind: "subscription" as const, direction: "outgoing" as const, title: "Сервис", amount: "12", currency: "USD", dueDate: new Date("2026-10-13"), reminderDaysBefore: 4, href: "/subscriptions?item=s" };
 const input = { tasks: [task, { ...task, id: "closed", status: "DONE" }, { ...task, id: "cancel", status: "CANCELLED" }, { ...task, id: "future", dueDate: new Date("2026-10-10") }], projects: [project, { ...project, id: "archive", status: "ARCHIVED" }], payments: [payment, { ...payment, id: "later", reminderDaysBefore: 3 }] };
 expect(collectReminders(input, DEFAULT_REMINDER_SETTINGS, now).map(i => i.id)).toEqual(["t", "p", "s"]);
 expect(collectReminders(input, { ...DEFAULT_REMINDER_SETTINGS, enabled: false }, now)).toEqual([]);
 expect(collectReminders(input, { ...DEFAULT_REMINDER_SETTINGS, tasks: false, subscriptions: false }, now).map(i => i.id)).toEqual(["p"]);
});
it("requires booleans in settings", () => {
 expect(reminderSettingsSchema.safeParse(DEFAULT_REMINDER_SETTINGS).success).toBe(true);
 expect(reminderSettingsSchema.safeParse({ enabled: "yes" }).success).toBe(false);
});
it("formats empty, long and untrusted titles into bounded plain-text messages", () => {
 expect(formatDigest([], now, "https://example.com")).toEqual([]);
 const items = Array.from({ length: 100 }, (_, i) => ({ id: String(i), kind: "task" as const, title: "<b>😀</b>".repeat(300), dueDate: task.dueDate, href: `/tasks?item=${i}` }));
 const parts = formatDigest(items, now, "https://example.com");
 expect(parts.length).toBeGreaterThan(1);
 expect(parts.every(p => p.length <= 3500)).toBe(true);
 expect(parts.join("\n")).toContain("https://example.com/tasks?item=99");
 expect(parts.join("\n")).toContain("Просрочено");
});
