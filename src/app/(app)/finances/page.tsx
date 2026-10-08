import { getPaymentObligations } from "@/features/payments/queries";
import type { Metadata } from "next";
import { FinancesView } from "@/features/finances/components/finances-view";
import {
  getAccountsWithBalance,
  getBudgetsWithSpend,
  getCategoriesWithCount,
  getFinanceInsights,
  getTransactions,
} from "@/features/finances/queries";

export const metadata: Metadata = { title: "Финансы" };

export default async function FinancesPage() {
  const [accounts, transactions, categories, budgets, insights, payments] = await Promise.all([
    getAccountsWithBalance(),
    getTransactions(),
    getCategoriesWithCount(),
    getBudgetsWithSpend(),
    getFinanceInsights(),
    getPaymentObligations(),
  ]);

  return (
    <FinancesView
      payments={payments}
      accounts={accounts}
      transactions={transactions}
      categories={categories}
      budgets={budgets}
      insights={insights}
    />
  );
}
