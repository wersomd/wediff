import { expect, it, vi } from "vitest";
import { createDeliveryRunner, type DeliveryRepository } from "../delivery";
import type { DeliveryResult } from "../types";
function memoryRepository() {
 const rows: { id: string; payload: string; status: string; attempts: number; notBefore: number }[] = [];
 let prepared = false;
 const repository: DeliveryRepository = {
  async prepare(_day, payloads) { if (!prepared) { prepared = true; rows.push(...payloads.map((payload, i) => ({ id: String(i), payload, status: "pending", attempts: 0, notBefore: 0 }))); } },
  async claim(_day, now) { const row = rows.find(r => ["pending", "failed"].includes(r.status) && r.attempts < 3 && r.notBefore <= now.getTime()); if (!row) return null; row.status = "sending"; row.attempts++; return { id: row.id, payload: row.payload }; },
  async finish(id, result, now) { const row = rows.find(r => r.id === id)!; row.status = result.status; row.notBefore = now.getTime() + (result.retryAfter ?? 60) * 1000; },
 };
 return { rows, repository };
}
it("concurrent runs claim each part once and never repeat successful parts", async () => {
 const { repository } = memoryRepository();
 const sendMessage = vi.fn(async (): Promise<DeliveryResult> => ({ status: "sent" }));
 const runner = createDeliveryRunner({ repository, sendMessage });
 const now = new Date();
 await Promise.all([runner.run("day", ["hello"], now), runner.run("day", ["hello"], now)]);
 await runner.run("day", ["changed content"], now);
 expect(sendMessage).toHaveBeenCalledTimes(1);
});
it("retries only known failures, observes backoff and caps attempts", async () => {
 const { repository, rows } = memoryRepository();
 const sendMessage = vi.fn(async (): Promise<DeliveryResult> => ({ status: "failed", retryAfter: 120 }));
 const runner = createDeliveryRunner({ repository, sendMessage });
 for (const seconds of [0, 60, 120, 240, 360]) await runner.run("day", ["a"], new Date(seconds * 1000));
 expect(sendMessage).toHaveBeenCalledTimes(3);
 expect(rows[0].attempts).toBe(3);
});
it("does not repeat ambiguous delivery; can resume a partial known failure", async () => {
 const { repository } = memoryRepository();
 const sendMessage = vi.fn<(_: string) => Promise<DeliveryResult>>()
  .mockResolvedValueOnce({ status: "sent" }).mockResolvedValueOnce({ status: "failed" }).mockResolvedValueOnce({ status: "unknown" });
 const runner = createDeliveryRunner({ repository, sendMessage });
 await runner.run("day", ["a", "b"], new Date(0));
 await runner.run("day", ["a", "b"], new Date(120000));
 await runner.run("day", ["a", "b"], new Date(240000));
 expect(sendMessage.mock.calls.map(c => c[0])).toEqual(["a", "b", "b"]);
});
it("does not send an empty digest", async () => {
 const { repository } = memoryRepository();
 const sendMessage = vi.fn();
 await createDeliveryRunner({ repository, sendMessage }).run("day", [], new Date());
 expect(sendMessage).not.toHaveBeenCalled();
});
