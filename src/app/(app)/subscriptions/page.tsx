import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Subscriptions" };

export default function SubscriptionsPage() {
  return (
    <>
      <PageHeader title="Subscriptions" description="What, how much, when the next payment is due." />
      <EmptyState
        icon={CreditCard}
        title="Subscriptions arrive in Phase 5"
        description="With Dashboard reminders for upcoming payments."
      />
    </>
  );
}
