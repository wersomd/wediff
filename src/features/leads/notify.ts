import type { LeadPayload } from "./inbound";

// Best-effort Telegram-уведомление о новой заявке. Никогда не бросает —
// приём лида не должен зависеть от доставки пинга.
export async function notifyNewLead(lead: LeadPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🟢 Новая заявка (${lead.source})\n` +
    `Имя: ${lead.name}\n` +
    `Контакт: ${lead.contact}\n` +
    `Задача: ${lead.message || "—"}`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // проглатываем — уведомление опционально
  }
}
