import { expect, it } from "vitest";
import { mergeTaskOrder, moveVisibleTask } from "../board-state";
import type { Columns } from "../components/board";
it("retains hidden tasks while reordering a visible subset", () => {
 expect(mergeTaskOrder(["a", "hidden", "b"], ["b", "a"])).toEqual(["b", "hidden", "a"]);
 expect(() => mergeTaskOrder(["a"], ["alien"])).toThrow();
 expect(() => mergeTaskOrder(["a"], ["a", "a"])).toThrow();
});
it("moves across filtered columns without discarding hidden cards", () => {
 const columns = { TODO: [{ id: "visible", status: "TODO" }, { id: "hidden", status: "TODO" }], REVIEW: [{ id: "review-hidden", status: "REVIEW" }], IN_PROGRESS: [], ON_HOLD: [], DONE: [], CANCELLED: [] } as unknown as Columns;
 const result = moveVisibleTask(columns, "visible", "REVIEW");
 expect(result.TODO.map(t => t.id)).toEqual(["hidden"]);
 expect(result.REVIEW.map(t => t.id)).toEqual(["review-hidden", "visible"]);
 expect(columns.TODO).toHaveLength(2);
});
