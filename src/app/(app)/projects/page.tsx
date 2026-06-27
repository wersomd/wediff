import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" description="Projects with tasks, status and notes." />
      <EmptyState
        icon={FolderKanban}
        title="Projects arrive in Phase 2"
        description="Tightly linked with Tasks — they form the core together."
      />
    </>
  );
}
