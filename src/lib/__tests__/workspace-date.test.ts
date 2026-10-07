import { expect, it } from "vitest";
import { dayKey, daysFromToday, dateOnly, localEventTime } from "../workspace-date";

it("uses Almaty day even before UTC midnight", () => {
  expect(dayKey(new Date("2026-10-06T19:01:00Z"))).toBe("2026-10-07");
  expect(dayKey(new Date("2026-10-06T18:59:00Z"))).toBe("2026-10-06");
});
it("keeps date-only fields independent of browser timezone", () => {
  expect(dateOnly(new Date("2026-10-07T00:00:00Z"))).toBe("2026-10-07");
  expect(daysFromToday(new Date("2026-10-07T00:00:00Z"), new Date("2026-10-06T20:00:00Z"))).toBe(0);
});
it("interprets entered event time in Almaty", () => {
  expect(localEventTime("2026-10-07", "09:30").toISOString()).toBe("2026-10-07T04:30:00.000Z");
});
it("reads legacy task dates saved at Almaty midnight before UTC normalization", () => {
  expect(dateOnly(new Date("2026-10-06T19:00:00Z"))).toBe("2026-10-07");
});
