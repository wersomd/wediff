import "server-only";
import { db } from "@/lib/db";

// Subscriptions ordered by the soonest upcoming payment. Amount → number.
export async function getSubscriptions() {
  const rows = await db.subscription.findMany({
    orderBy: [{ active: "desc" }, { nextPaymentDate: "asc" }],
    include: { category: { select: { id: true, name: true, color: true } } },
  });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    amount: s.amount.toNumber(),
    currency: s.currency,
    billingCycle: s.billingCycle,
    nextPaymentDate: s.nextPaymentDate,
    reminderDaysBefore: s.reminderDaysBefore,
    url: s.url,
    icon: s.icon,
    active: s.active,
    category: s.category,
  }));
}

export type SubscriptionRow = Awaited<
  ReturnType<typeof getSubscriptions>
>[number];
