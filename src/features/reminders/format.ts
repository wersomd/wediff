import { dayKey, daysFromToday } from "@/lib/workspace-date";
import type { ReminderItem } from "./types";
const labels = { task: "Задача", project: "Проект", debt: "Долг", subscription: "Подписка" };
function short(text: string, limit = 500) {
 const chars = Array.from(text.replace(/[\r\n\t]+/g, " "));
 return chars.length > limit ? chars.slice(0, limit).join("") + "…" : chars.join("");
}
export function formatDigest(items: ReminderItem[], now: Date, baseUrl: string): string[] {
 if (!items.length) return [];
 const url = new URL(baseUrl);
 if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("INVALID_APP_URL");
 const heading = `WH·OS · ${dayKey(now)} · Алматы\n`;
 const chunks: string[] = [];
 let chunk = heading;
 for (const item of items) {
  const days = daysFromToday(item.dueDate, now);
  const due = days < 0 ? `Просрочено на ${-days} дн.` : days === 0 ? "Сегодня" : `Через ${days} дн.`;
  const link = new URL(item.href, url.origin).toString();
  const entry = `\n${labels[item.kind]} · ${due}\n${short(item.title)}${item.detail ? `\n${short(item.detail, 200)}` : ""}\n${link}\n`;
  if (entry.length + heading.length > 3500) throw new Error("REMINDER_LINK_TOO_LONG");
  if (chunk.length + entry.length > 3500) { chunks.push(chunk); chunk = heading; }
  chunk += entry;
 }
 if (chunk !== heading) chunks.push(chunk);
 return chunks;
}
