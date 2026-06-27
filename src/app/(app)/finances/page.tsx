import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Finances" };

export default function FinancesPage() {
  return (
    <>
      <PageHeader title="Finances" description="Income, expenses, categories, balances, analytics." />
      <EmptyState
        icon={Wallet}
        title="Finances arrive in Phase 5"
        description="Accounts in KZT and USD, with per-currency totals."
      />
    </>
  );
}
