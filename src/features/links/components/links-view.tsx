"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, Plus, Search } from "lucide-react";
import { BookmarkType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BookmarkCard } from "./bookmark-card";
import { BookmarkDialog } from "./bookmark-dialog";
import { deleteBookmark, toggleBookmarkArchive } from "../actions";
import type { BookmarkWithTags } from "../queries";

const ALL = "ALL";

export function LinksView({
  initialBookmarks,
  tags,
}: {
  initialBookmarks: BookmarkWithTags[];
  tags: string[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [tagFilter, setTagFilter] = useState(ALL);
  const [archive, setArchive] = useState("active"); // active | archived | all
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BookmarkWithTags | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialBookmarks.filter((b) => {
      if (archive === "active" && b.isArchived) return false;
      if (archive === "archived" && !b.isArchived) return false;
      if (typeFilter !== ALL && b.type !== typeFilter) return false;
      if (tagFilter !== ALL && !b.tags.some((t) => t.name === tagFilter))
        return false;
      if (
        q &&
        !(b.title ?? "").toLowerCase().includes(q) &&
        !b.url.toLowerCase().includes(q) &&
        !(b.description ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [initialBookmarks, query, typeFilter, tagFilter, archive]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function remove(b: BookmarkWithTags) {
    if (!window.confirm(`Удалить ссылку «${b.title ?? b.url}»?`)) return;
    start(async () => {
      const res = await deleteBookmark(b.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Ссылка удалена");
      router.refresh();
    });
  }

  function toggleArchive(b: BookmarkWithTags) {
    start(async () => {
      const res = await toggleBookmarkArchive(b.id, !b.isArchived);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Links"
        description="Закладки и видео с тегами; YouTube и favicon определяются автоматически."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Новая ссылка
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все типы</SelectItem>
            <SelectItem value={BookmarkType.LINK}>Ссылки</SelectItem>
            <SelectItem value={BookmarkType.YOUTUBE}>YouTube</SelectItem>
          </SelectContent>
        </Select>
        <Select value={archive} onValueChange={setArchive}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="archived">В архиве</SelectItem>
            <SelectItem value="all">Все</SelectItem>
          </SelectContent>
        </Select>
        {tags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Все теги</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t} value={t}>
                  #{t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={initialBookmarks.length === 0 ? "Пока нет ссылок" : "Ничего не найдено"}
          description={
            initialBookmarks.length === 0
              ? "Добавьте первую закладку — вставьте URL."
              : "Измените поиск или фильтры."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <BookmarkCard
              key={b.id}
              bookmark={b}
              onEdit={() => {
                setEditing(b);
                setDialogOpen(true);
              }}
              onDelete={() => remove(b)}
              onToggleArchive={() => toggleArchive(b)}
            />
          ))}
        </div>
      )}

      <BookmarkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bookmark={editing}
        tagSuggestions={tags}
      />
    </>
  );
}
