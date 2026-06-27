import type { Metadata } from "next";
import { Files } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Files" };

export default function FilesPage() {
  return (
    <>
      <PageHeader title="Files" description="Upload, store and preview your files." />
      <EmptyState
        icon={Files}
        title="Files arrive in Phase 6"
        description="Backed by Supabase Storage through a swappable provider."
      />
    </>
  );
}
