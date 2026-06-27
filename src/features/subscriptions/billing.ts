import { addMonths, addWeeks, addYears } from "date-fns";
import { BillingCycle } from "@prisma/client";

// Advance a date by one billing cycle (used by "mark paid").
export function advanceByCycle(date: Date, cycle: BillingCycle): Date {
  switch (cycle) {
    case BillingCycle.WEEKLY:
      return addWeeks(date, 1);
    case BillingCycle.MONTHLY:
      return addMonths(date, 1);
    case BillingCycle.QUARTERLY:
      return addMonths(date, 3);
    case BillingCycle.YEARLY:
      return addYears(date, 1);
  }
}

// Normalize a subscription's cost to a monthly figure for totals.
export function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case BillingCycle.WEEKLY:
      return (amount * 52) / 12;
    case BillingCycle.MONTHLY:
      return amount;
    case BillingCycle.QUARTERLY:
      return amount / 3;
    case BillingCycle.YEARLY:
      return amount / 12;
  }
}
