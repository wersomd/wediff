import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Links" };

export default function LinksPage() {
  return (
    <>
      <PageHeader title="Links" description="Links & YouTube videos to watch later, with tags and previews." />
      <EmptyState
        icon={Bookmark}
        title="Links arrive in Phase 3"
        description="Auto previews, YouTube thumbnails, and a read/watched state."
      />
    </>
  );
}
