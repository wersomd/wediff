import { expect, it } from "vitest";
import { calendarDay } from "../placement";
it("groups events by Almaty date and date-only records by their stored date", () => {
  const now = new Date("2026-10-07T10:00Z");
  expect(calendarDay({ kind: "event", date: new Date("2026-10-06T20:00Z") }, now)).toBe("2026-10-07");
  expect(calendarDay({ kind: "task", date: new Date("2026-10-08T00:00Z") }, now)).toBe("2026-10-08");
});
it("surfaces overdue deadlines on today without changing their real date", () => {
  const item = { kind: "debt" as const, date: new Date("2026-10-01") };
  expect(calendarDay(item, new Date("2026-10-07T10:00Z"))).toBe("2026-10-07");
  expect(item.date.toISOString()).toBe("2026-10-01T00:00:00.000Z");
});
it("keeps historical deadlines in place when today is outside the visible grid", () => {
  expect(calendarDay({ kind: "task", date: new Date("2026-09-12") }, new Date("2026-10-07T10:00Z"), false)).toBe("2026-09-12");
});
