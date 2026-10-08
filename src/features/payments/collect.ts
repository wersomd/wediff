import { Prisma } from "@prisma/client";
import type { PaymentObligation } from "./types";
export function remainingAmount(principal: string, payments: string[]): string {
 const remaining = payments.reduce((value, payment) => value.minus(payment), new Prisma.Decimal(principal));
 return Prisma.Decimal.max(0, remaining).toFixed(2);
}
type DebtInput = { id: string; title: string; principal: string; payments: string[]; currency: string; direction: "I_OWE" | "OWED_TO_ME"; status: string; dueDate: Date | null };
type SubscriptionInput = { id: string; name: string; amount: string; currency: string; active: boolean; nextPaymentDate: Date; reminderDaysBefore: number };
export function collectPayments(debts: DebtInput[], subscriptions: SubscriptionInput[]): PaymentObligation[] {
 const result: PaymentObligation[] = [];
 for (const debt of debts) {
  const amount = remainingAmount(debt.principal, debt.payments);
  if (debt.status !== "OPEN" || !debt.dueDate || new Prisma.Decimal(amount).lte(0)) continue;
  result.push({ id: debt.id, kind: "debt", direction: debt.direction === "I_OWE" ? "outgoing" : "incoming", title: debt.title, amount, currency: debt.currency, dueDate: debt.dueDate, reminderDaysBefore: 3, href: `/debts?item=${encodeURIComponent(debt.id)}` });
 }
 for (const sub of subscriptions) if (sub.active) result.push({ id: sub.id, kind: "subscription", direction: "outgoing", title: sub.name, amount: sub.amount, currency: sub.currency, dueDate: sub.nextPaymentDate, reminderDaysBefore: sub.reminderDaysBefore, href: `/subscriptions?item=${encodeURIComponent(sub.id)}` });
 return result.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
