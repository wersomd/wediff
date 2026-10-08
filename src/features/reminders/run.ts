import "server-only";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/workspace-date";
import { getReminderSettings, reminderConfiguration } from "./settings";
import { getReminderSources } from "./queries";
import { collectReminders } from "./collect";
import { formatDigest } from "./format";
import { createDeliveryRunner } from "./delivery";
import { deliveryRepository } from "./repository";
import { sendTelegramMessage } from "./telegram";
export async function runDailyReminders(now = new Date()) {
 const config = reminderConfiguration();
 if (!config.telegram || !config.scheduler || !config.appUrl) throw new Error("REMINDERS_NOT_CONFIGURED");
 const settings = await getReminderSettings();
 if (!settings.enabled) return { sent: 0, failed: 0, remaining: 0, skipped: true };
 const day = dayKey(now);
 const sources = await getReminderSources();
 const messages = formatDigest(collectReminders(sources, settings, now), now, process.env.APP_BASE_URL!);
 const runner = createDeliveryRunner({ repository: deliveryRepository, sendMessage: text => sendTelegramMessage(process.env.TELEGRAM_BOT_TOKEN!, process.env.TELEGRAM_CHAT_ID!, text) });
 const result = await runner.run(day, messages, now);
 const remaining = await db.reminderDelivery.count({ where: { day, status: { notIn: ["sent", "cancelled"] } } });
 await db.reminderDelivery.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 30 * 86400000) } } });
 return { ...result, remaining, skipped: messages.length === 0 && remaining === 0 };
}
