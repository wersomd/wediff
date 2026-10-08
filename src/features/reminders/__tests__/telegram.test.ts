import { expect, it, vi } from "vitest";
import { sendTelegramMessage } from "../telegram";
it("checks HTTP and Telegram ok independently", async () => {
 const transport = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, error_code: 400 }), { status: 200 }));
 expect(await sendTelegramMessage("token", "chat", "text", transport)).toMatchObject({ status: "failed" });
 expect(JSON.parse(transport.mock.calls[0][1].body)).not.toHaveProperty("parse_mode");
});
it("keeps retry_after and treats ambiguous transport failures as unknown", async () => {
 expect(await sendTelegramMessage("t", "c", "x", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, parameters: { retry_after: 42 } }), { status: 429 })))).toMatchObject({ status: "failed", retryAfter: 42 });
 expect(await sendTelegramMessage("t", "c", "x", vi.fn().mockRejectedValue(new Error("timeout")))).toMatchObject({ status: "unknown" });
 expect(await sendTelegramMessage("t", "c", "x", vi.fn().mockResolvedValue(new Response("bad")))).toMatchObject({ status: "unknown" });
 expect(await sendTelegramMessage("t", "c", "x", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }))))).toEqual({ status: "sent" });
});
