import { daysFromToday } from "@/lib/workspace-date";
import type { PaymentObligation } from "@/features/payments/types";
import type { ReminderSettings } from "./schema";
import type { ReminderItem } from "./types";
type Input = {
 tasks: { id: string; title: string; dueDate: Date | null; status: string }[];
 projects: { id: string; name: string; deadline: Date | null; status: string }[];
 payments: PaymentObligation[];
};
export function collectReminders(input: Input, settings: ReminderSettings, now: Date): ReminderItem[] {
 if (!settings.enabled) return [];
 const items: ReminderItem[] = [];
 if (settings.tasks) for (const t of input.tasks) if (t.dueDate && !["DONE", "CANCELLED"].includes(t.status) && daysFromToday(t.dueDate, now) <= 0) items.push({ id: t.id, kind: "task", title: t.title, dueDate: t.dueDate, href: `/tasks?item=${encodeURIComponent(t.id)}` });
 if (settings.projects) for (const p of input.projects) if (p.deadline && !["DONE", "ARCHIVED"].includes(p.status) && daysFromToday(p.deadline, now) <= 3) items.push({ id: p.id, kind: "project", title: p.name, dueDate: p.deadline, href: `/projects/${encodeURIComponent(p.id)}` });
 for (const p of input.payments) {
  if (!(p.kind === "debt" ? settings.debts : settings.subscriptions) || daysFromToday(p.dueDate, now) > p.reminderDaysBefore) continue;
  items.push({ ...p, detail: `${p.kind === "subscription" ? "Подписка" : p.direction === "incoming" ? "Мне должны" : "Я должен"}: ${p.amount} ${p.currency}` });
 }
 return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime() || a.id.localeCompare(b.id));
}
