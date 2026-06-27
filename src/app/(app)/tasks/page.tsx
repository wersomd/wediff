import type { Metadata } from "next";
import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <>
      <PageHeader title="Tasks" description="Statuses, priorities, deadlines, project links." />
      <EmptyState
        icon={CheckSquare}
        title="Tasks arrive in Phase 2"
        description="The task tracker is the core module — built alongside Projects."
      />
    </>
  );
}
