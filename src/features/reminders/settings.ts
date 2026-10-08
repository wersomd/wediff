import "server-only";
import { db } from "@/lib/db";
import { DEFAULT_REMINDER_SETTINGS, reminderSettingsSchema } from "./schema";
export async function getReminderSettings() {
 const stored = await db.setting.findUnique({ where: { key: "reminders" } });
 if (!stored) return DEFAULT_REMINDER_SETTINGS;
 return reminderSettingsSchema.parse(stored.value);
}
export function reminderConfiguration() {
 let validUrl = false;
 try { const url = new URL(process.env.APP_BASE_URL ?? ""); validUrl = ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; } catch { /* absent */ }
 return { telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim()), scheduler: Boolean(process.env.CRON_SECRET?.trim()), appUrl: validUrl };
}
export async function getReminderStatus() {
 const config = reminderConfiguration();
 try {
  const [lastSent, problem, waiting] = await Promise.all([
   db.reminderDelivery.findFirst({ where: { status: "sent" }, orderBy: { sentAt: "desc" }, select: { sentAt: true } }),
   db.reminderDelivery.findFirst({ where: { status: { in: ["failed", "unknown"] } }, orderBy: { updatedAt: "desc" }, select: { status: true, updatedAt: true } }),
   db.reminderDelivery.count({ where: { status: { in: ["pending", "sending"] } } }),
  ]);
  return { ...config, journalAvailable: true, lastSentAt: lastSent?.sentAt?.toISOString() ?? null, problem: problem ? { status: problem.status, date: problem.updatedAt.toISOString() } : null, waiting };
 } catch {
  return { ...config, journalAvailable: false, lastSentAt: null, problem: null, waiting: 0 };
 }
}
