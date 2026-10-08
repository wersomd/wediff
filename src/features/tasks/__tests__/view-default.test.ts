import { describe, expect, it } from "vitest";
import { DEFAULT_TASK_VIEW } from "../constants";

describe("DEFAULT_TASK_VIEW", () => {
  it("opens the task workspace in board mode", () => {
    expect(DEFAULT_TASK_VIEW).toBe("board");
  });
});

import { resolveTaskView } from "../board-state";
it("only opens list when explicitly requested", () => {
 expect(resolveTaskView(null)).toBe("board");
 expect(resolveTaskView("list")).toBe("list");
 expect(resolveTaskView("bad")).toBe("board");
});
