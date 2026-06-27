import type { Metadata } from "next";
import { Repeat } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Habits" };

export default function HabitsPage() {
  return (
    <>
      <PageHeader title="Habits" description="Habits, streaks, a calendar heatmap." />
      <EmptyState
        icon={Repeat}
        title="Habits arrive in Phase 4"
        description="Streaks and a GitHub-style heatmap built on daily entries."
      />
    </>
  );
}
