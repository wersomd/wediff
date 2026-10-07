import "server-only";
import { db } from "@/lib/db";
import { dayKey, localEventTime } from "@/lib/workspace-date";
import { getAccountsWithBalance } from "@/features/finances/queries";
import { getTasks, getProjectsForPicker } from "@/features/tasks/queries";

export async function getTodayWorkspace() {
  const now = new Date();
  const today = dayKey(now);
  const end = new Date(`${today}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 7);
  const [tasks, projects, accounts, subscriptions, debts, events] = await Promise.all([
    getTasks(), getProjectsForPicker(), getAccountsWithBalance(),
    db.subscription.findMany({ where: { active: true, nextPaymentDate: { lt: end } }, orderBy: { nextPaymentDate: "asc" } }),
    db.debt.findMany({ where: { status: "OPEN", dueDate: { not: null, lt: end } }, include: { counterparty: true, payments: true } }),
    db.calendarEvent.findMany({ where: { startAt: { gte: localEventTime(today), lt: new Date(localEventTime(today).getTime() + 86400000) } }, orderBy: { startAt: "asc" } }),
  ]);
  const balances: Record<string, number> = {};
  for (const a of accounts) if (!a.archived) balances[a.currency] = (balances[a.currency] ?? 0) + a.balance;
  const payments = [
    ...subscriptions.map((s) => ({ id: `sub-${s.id}`, title: s.name, date: s.nextPaymentDate, amount: s.amount.toNumber(), currency: s.currency, label: "Подписка", href: `/subscriptions?item=${encodeURIComponent(s.id)}` })),
    ...debts.map((d) => ({ id: `debt-${d.id}`, title: d.counterparty.name, date: d.dueDate!, amount: Math.max(0, d.principal.toNumber() - d.payments.reduce((n, p) => n + p.amount.toNumber(), 0)), currency: d.currency, label: d.direction === "I_OWE" ? "Я должен" : "Мне должны", href: `/debts?item=${encodeURIComponent(d.id)}` })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
  return { tasks, projects, balances, payments, events, now };
}
export type TodayWorkspace = Awaited<ReturnType<typeof getTodayWorkspace>>;
