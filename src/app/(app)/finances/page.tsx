import type { Metadata } from "next";
import { FinancesView } from "@/features/finances/components/finances-view";
import {
  getAccountsWithBalance,
  getCategories,
  getTransactions,
} from "@/features/finances/queries";

export const metadata: Metadata = { title: "Финансы" };

export default async function FinancesPage() {
  const [accounts, transactions, categories] = await Promise.all([
    getAccountsWithBalance(),
    getTransactions(),
    getCategories(),
  ]);

  return (
    <FinancesView
      accounts={accounts}
      transactions={transactions}
      categories={categories}
    />
  );
}
