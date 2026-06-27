import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FilesView } from "@/features/files/components/files-view";
import { getFolderContents } from "@/features/files/queries";
import { isStorageConfigured } from "@/lib/storage";

export const metadata: Metadata = { title: "Files" };

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder } = await searchParams;
  const folderId = folder ?? null;
  const { folders, files, breadcrumbs, currentId } =
    await getFolderContents(folderId);
  const storageReady = isStorageConfigured();

  return (
    <>
      <PageHeader
        title="Files"
        description="Папки и файлы в Supabase Storage."
      />

      {!storageReady && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Хранилище не настроено. Задайте <code>SUPABASE_URL</code> и{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> в <code>.env</code>, чтобы
            загружать файлы. Папки работают и без этого.
          </span>
        </div>
      )}

      <FilesView
        folders={folders}
        files={files}
        breadcrumbs={breadcrumbs}
        currentId={currentId}
      />
    </>
  );
}
