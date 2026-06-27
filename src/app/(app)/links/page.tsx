import type { Metadata } from "next";
import { LinksView } from "@/features/links/components/links-view";
import { getBookmarks } from "@/features/links/queries";
import { getTags } from "@/features/tags/queries";

export const metadata: Metadata = { title: "Links" };

export default async function LinksPage() {
  const [bookmarks, tags] = await Promise.all([getBookmarks(), getTags()]);
  return (
    <LinksView
      initialBookmarks={bookmarks}
      tags={tags.map((t) => t.name)}
    />
  );
}
