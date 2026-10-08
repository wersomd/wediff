import type { DeliveryResult } from "./types";
export async function sendTelegramMessage(token: string, chatId: string, text: string, transport: typeof fetch = fetch): Promise<DeliveryResult> {
 try {
  const response = await transport(`https://api.telegram.org/bot${token}/sendMessage`, {
   method: "POST", headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ chat_id: chatId, text, link_preview_options: { is_disabled: true } }),
   signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json();
  if (response.ok && body?.ok === true && Number.isInteger(body?.result?.message_id)) return { status: "sent" };
  if (body?.ok === false) {
   const retryAfter = Number(body.parameters?.retry_after);
   return { status: "failed", errorCode: `TELEGRAM_${Number(body.error_code) || response.status}`, retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 86400) : undefined };
  }
  return { status: "unknown", errorCode: "UNEXPECTED_RESPONSE" };
 } catch {
  // A timeout may occur after Telegram accepted a message. Do not auto-retry.
  return { status: "unknown", errorCode: "DELIVERY_UNCONFIRMED" };
 }
}
