import { describe, expect, it, vi, afterEach } from "vitest";
import { TaskStatus } from "@prisma/client";
import { formatDue, overdueLabel } from "../format";

afterEach(() => {
  vi.useRealTimers();
});

function freezeAt(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

describe("formatDue overdue rules", () => {
  it("flags a past-due TODO as overdue with a day count", () => {
    freezeAt("2026-06-15T10:00:00");
    const info = formatDue(new Date("2026-06-12"), TaskStatus.TODO);
    expect(info.overdue).toBe(true);
    expect(info.overdueDays).toBe(3);
  });

  it("flags a past-due IN_PROGRESS as overdue", () => {
    freezeAt("2026-06-15T10:00:00");
    expect(formatDue(new Date("2026-06-14"), TaskStatus.IN_PROGRESS).overdue).toBe(
      true,
    );
  });

  it("flags a past-due REVIEW task in the shared open-task model", () => {
    freezeAt("2026-06-15T10:00:00");
    const info = formatDue(new Date("2026-06-01"), TaskStatus.REVIEW);
    expect(info.overdue).toBe(true);
    expect(info.overdueDays).toBe(14);
  });

  it("flags a past-due ON_HOLD task in the shared open-task model", () => {
    freezeAt("2026-06-15T10:00:00");
    expect(formatDue(new Date("2026-06-01"), TaskStatus.ON_HOLD).overdue).toBe(
      true,
    );
  });

  it("does NOT flag a future due date", () => {
    freezeAt("2026-06-15T10:00:00");
    expect(formatDue(new Date("2026-06-20"), TaskStatus.TODO).overdue).toBe(false);
  });

  it("treats a missing status as actionable (back-compat)", () => {
    freezeAt("2026-06-15T10:00:00");
    expect(formatDue(new Date("2026-06-10")).overdue).toBe(true);
  });
});

describe("overdueLabel", () => {
  it("formats the day count", () => {
    expect(overdueLabel(3)).toBe("просрочено на 3 дн.");
  });
});
