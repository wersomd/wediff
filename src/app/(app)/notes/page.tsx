import type { Metadata } from "next";
import { StickyNote } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Notes" };

export default function NotesPage() {
  return (
    <>
      <PageHeader title="Notes" description="Markdown notes with tags." />
      <EmptyState
        icon={StickyNote}
        title="Notes arrive in Phase 3"
        description="Markdown editing, pinning and shared tags."
      />
    </>
  );
}
