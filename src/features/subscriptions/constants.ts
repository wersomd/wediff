import { BillingCycle } from "@prisma/client";

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  WEEKLY: "Еженедельно",
  MONTHLY: "Ежемесячно",
  QUARTERLY: "Раз в квартал",
  YEARLY: "Ежегодно",
};

export const BILLING_CYCLE_SHORT: Record<BillingCycle, string> = {
  WEEKLY: "/нед",
  MONTHLY: "/мес",
  QUARTERLY: "/кв",
  YEARLY: "/год",
};

export const BILLING_CYCLE_ORDER: BillingCycle[] = [
  BillingCycle.MONTHLY,
  BillingCycle.YEARLY,
  BillingCycle.QUARTERLY,
  BillingCycle.WEEKLY,
];
