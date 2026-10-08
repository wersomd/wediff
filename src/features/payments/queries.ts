import "server-only";
import { db } from "@/lib/db";
import { collectPayments } from "./collect";
export async function getPaymentObligations() {
 const [debts, subscriptions] = await Promise.all([
  db.debt.findMany({ where: { status: "OPEN", dueDate: { not: null } }, include: { counterparty: true, payments: true } }),
  db.subscription.findMany({ where: { active: true } }),
 ]);
 return collectPayments(debts.map(d => ({ ...d, title: d.counterparty.name, principal: d.principal.toString(), payments: d.payments.map(p => p.amount.toString()) })), subscriptions.map(s => ({ ...s, amount: s.amount.toString() })));
}
