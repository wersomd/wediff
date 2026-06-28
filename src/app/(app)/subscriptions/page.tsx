import type { Metadata } from "next";
import { TransactionType } from "@prisma/client";
import { SubscriptionsView } from "@/features/subscriptions/components/subscriptions-view";
import { getSubscriptions } from "@/features/subscriptions/queries";
import { getCategories } from "@/features/finances/queries";

export const metadata: Metadata = { title: "Подписки" };

export default async function SubscriptionsPage() {
  const [subscriptions, categories] = await Promise.all([
    getSubscriptions(),
    getCategories(),
  ]);

  return (
    <SubscriptionsView
      subscriptions={subscriptions}
      categories={categories
        .filter((c) => c.type === TransactionType.EXPENSE)
        .map((c) => c.name)}
    />
  );
}
