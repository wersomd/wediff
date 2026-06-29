import "server-only";
import { db } from "@/lib/db";

// Counterparties that have at least one debt, with each debt's payments rolled
// up into paid / remaining. Decimals are converted to plain numbers at this
// boundary for the client. Settled debts come last within a counterparty.
export async function getDebtsView() {
  const counterparties = await db.counterparty.findMany({
    where: { debts: { some: {} } },
    orderBy: { name: "asc" },
    include: {
      debts: {
        orderBy: [{ status: "asc" }, { borrowedOn: "desc" }],
        include: { payments: { orderBy: { paidOn: "desc" } } },
      },
    },
  });

  return counterparties.map((c) => {
    const debts = c.debts.map((d) => {
      const principal = d.principal.toNumber();
      const paid = d.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
      return {
        id: d.id,
        counterpartyId: d.counterpartyId,
        direction: d.direction,
        principal,
        currency: d.currency,
        description: d.description,
        borrowedOn: d.borrowedOn,
        dueDate: d.dueDate,
        status: d.status,
        paid,
        remaining: Math.max(principal - paid, 0),
        payments: d.payments.map((p) => ({
          id: p.id,
          amount: p.amount.toNumber(),
          paidOn: p.paidOn,
          note: p.note,
        })),
      };
    });
    return { id: c.id, name: c.name, note: c.note, debts };
  });
}

export type CounterpartyView = Awaited<
  ReturnType<typeof getDebtsView>
>[number];
export type DebtView = CounterpartyView["debts"][number];
export type PaymentView = DebtView["payments"][number];

// Distinct counterparty names for the create dialog's combobox / datalist.
export async function getCounterpartyNames(): Promise<string[]> {
  const rows = await db.counterparty.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return rows.map((r) => r.name);
}
