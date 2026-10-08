import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $transaction: async (callback: (tx: unknown) => unknown) => callback({ task: mocks }) } }));
import { moveTask } from "../actions";
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ user: { id: "owner" } }); mocks.findUnique.mockResolvedValue({ id: "a", completedAt: null }); mocks.findMany.mockResolvedValue([{ id: "hidden" }, { id: "b" }]); });
it("rejects alien and duplicated task IDs before writing", async () => {
 for (const orderedIds of [["a", "alien"], ["a", "a"], ["b"]]) expect(await moveTask({ taskId: "a", toStatus: "REVIEW", orderedIds })).toHaveProperty("error");
 expect(mocks.update).not.toHaveBeenCalled();
});
it("preserves hidden target cards and reconciles completedAt", async () => {
 expect(await moveTask({ taskId: "a", toStatus: "DONE", orderedIds: ["a", "b"] })).toEqual({ ok: true });
 expect(mocks.update.mock.calls.slice(0, 3).map(c => [c[0].where.id, c[0].data.order])).toEqual([["hidden", 0], ["a", 1], ["b", 2]]);
 expect(mocks.update.mock.calls.at(-1)?.[0].data.completedAt).toBeInstanceOf(Date);
 mocks.update.mockClear();
 await moveTask({ taskId: "a", toStatus: "TODO" });
 expect(mocks.update.mock.calls.at(-1)?.[0].data.completedAt).toBeNull();
});
it("does not mutate for unauthenticated or deleted tasks", async () => {
 mocks.findUnique.mockResolvedValue(null);
 expect(await moveTask({ taskId: "missing", toStatus: "DONE" })).toHaveProperty("error");
 mocks.auth.mockResolvedValue(null);
 await expect(moveTask({ taskId: "a", toStatus: "DONE" })).rejects.toThrow("Unauthorized");
 expect(mocks.update).not.toHaveBeenCalled();
});
