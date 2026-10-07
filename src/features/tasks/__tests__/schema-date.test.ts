import { expect, it } from "vitest";
import { taskCreateSchema } from "../schema";
it("stores input calendar dates at UTC midnight", () => {
  expect(taskCreateSchema.parse({ title: "Task", dueDate: "2026-10-07" }).dueDate?.toISOString()).toBe("2026-10-07T00:00:00.000Z");
});
