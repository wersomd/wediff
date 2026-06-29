import type { Metadata } from "next";
import { DebtsView } from "@/features/debts/components/debts-view";
import { getDebtsView, getCounterpartyNames } from "@/features/debts/queries";
import { getAccountsWithBalance } from "@/features/finances/queries";

export const metadata: Metadata = { title: "Долги" };

export default async function DebtsPage() {
  const [counterparties, accounts, counterpartyNames] = await Promise.all([
    getDebtsView(),
    getAccountsWithBalance(),
    getCounterpartyNames(),
  ]);

  return (
    <DebtsView
      counterparties={counterparties}
      accounts={accounts}
      counterpartyNames={counterpartyNames}
    />
  );
}
