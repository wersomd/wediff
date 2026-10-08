import { beforeEach, expect, it, vi } from "vitest";
const run = vi.hoisted(() => vi.fn());
vi.mock("../run", () => ({ runDailyReminders: run }));
import { GET } from "@/app/api/cron/reminders/route";
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("CRON_SECRET", "test-secret"); });
it("fails closed without a secret or valid authorization", async () => {
 for (const header of [null, "Bearer invalid", "Bearer test-secret-extra"]) {
  const response = await GET(new Request("https://example.com/api/cron/reminders", { headers: header ? { authorization: header } : {} }));
  expect(response.status).toBe(401);
 }
 vi.stubEnv("CRON_SECRET", "");
 expect((await GET(new Request("https://example.com", { headers: { authorization: "Bearer " } }))).status).toBe(401);
 expect(run).not.toHaveBeenCalled();
});
it("reports incomplete deliveries and hides internal errors", async () => {
 const request = () => new Request("https://example.com", { headers: { authorization: "Bearer test-secret" } });
 run.mockResolvedValueOnce({ sent: 1, failed: 0, remaining: 1 });
 expect((await GET(request())).status).toBe(503);
 run.mockRejectedValueOnce(new Error("token=private"));
 const response = await GET(request());
 expect(JSON.stringify(await response.json())).not.toContain("private");
 run.mockResolvedValueOnce({ sent: 1, failed: 0, remaining: 0 });
 expect((await GET(request())).status).toBe(200);
});
