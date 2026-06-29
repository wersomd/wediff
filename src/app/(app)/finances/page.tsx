import type { Metadata } from "next";
import { FinancesView } from "@/features/finances/components/finances-view";
import {
  getAccountsWithBalance,
  getBudgetsWithSpend,
  getCategories,
  getTransactions,
} from "@/features/finances/queries";

export const metadata: Metadata = { title: "Финансы" };

export default async function FinancesPage() {
  const [accounts, transactions, categories, budgets] = await Promise.all([
    getAccountsWithBalance(),
    getTransactions(),
    getCategories(),
    getBudgetsWithSpend(),
  ]);

  return (
    <FinancesView
      accounts={accounts}
      transactions={transactions}
      categories={categories}
      budgets={budgets}
    />
  );
}
