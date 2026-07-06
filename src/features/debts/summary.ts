import { DebtDirection, DebtStatus, InstallmentStatus } from "@prisma/client";

// Per-currency net totals for a flat list of debts. KZT and USD never sum
// together — each currency is reported on its own line.
export type CurrencyTotals = {
  iOwe: number;
  owedToMe: number;
  net: number; // owedToMe − iOwe
};

type DebtLike = {
  direction: DebtDirection;
  currency: string;
  remaining: number;
  status: DebtStatus;
};

export function computeDebtTotals(
  debts: DebtLike[],
): Record<string, CurrencyTotals> {
  const totals: Record<string, CurrencyTotals> = {};
  for (const d of debts) {
    if (d.status !== DebtStatus.OPEN) continue;
    const t = (totals[d.currency] ??= { iOwe: 0, owedToMe: 0, net: 0 });
    if (d.direction === DebtDirection.I_OWE) t.iOwe += d.remaining;
    else t.owedToMe += d.remaining;
    t.net = t.owedToMe - t.iOwe;
  }
  return totals;
}

// A debt is overdue when its due date has passed and it is still open.
export function isOverdue(
  debt: { dueDate: Date | null; status: DebtStatus },
  now: Date = new Date(),
): boolean {
  return (
    debt.status === DebtStatus.OPEN &&
    debt.dueDate !== null &&
    debt.dueDate.getTime() < now.getTime()
  );
}

type InstallmentLike = { seq: number; dueDate: Date; status: InstallmentStatus };

// The earliest month still awaiting payment (drives the "next payment" line and
// overdue badge for installment debts). Null once everything is paid.
export function nextInstallment<T extends InstallmentLike>(
  installments: T[],
): T | null {
  return (
    installments
      .filter((i) => i.status === InstallmentStatus.PENDING)
      .sort((a, b) => a.seq - b.seq)[0] ?? null
  );
}

// An installment plan is overdue when its next pending month's due date passed.
export function installmentOverdue(
  installments: InstallmentLike[],
  now: Date = new Date(),
): boolean {
  const next = nextInstallment(installments);
  return next !== null && next.dueDate.getTime() < now.getTime();
}
