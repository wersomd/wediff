"use client";

import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { BookmarkType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { hostnameOf } from "../meta";
import type { BookmarkWithTags } from "../queries";

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onToggleArchive,
}: {
  bookmark: BookmarkWithTags;
  onEdit: () => void;
  onDelete: () => void;
  onToggleArchive: () => void;
}) {
  const host = hostnameOf(bookmark.url);
  const isYouTube = bookmark.type === BookmarkType.YOUTUBE;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/20",
        bookmark.isArchived && "opacity-60",
      )}
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noreferrer noopener"
        className="absolute inset-0"
        aria-label={bookmark.title ?? bookmark.url}
      />

      {isYouTube && bookmark.thumbnailUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bookmark.thumbnailUrl}
            alt=""
            className="size-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-black/60">
              <Play className="size-5 fill-white text-white" />
            </span>
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {bookmark.faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bookmark.faviconUrl} alt="" className="size-4 shrink-0 rounded-sm" />
            )}
            <span className="truncate text-xs text-muted-foreground">{host}</span>
          </div>
          <div className="relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-md p-1 text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-accent focus-visible:opacity-100 group-hover:opacity-100"
                aria-label="Действия"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onEdit} className="cursor-pointer">
                  <Pencil className="size-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onToggleArchive} className="cursor-pointer">
                  {bookmark.isArchived ? (
                    <>
                      <ArchiveRestore className="size-4" />
                      Вернуть из архива
                    </>
                  ) : (
                    <>
                      <Archive className="size-4" />
                      В архив
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={onDelete}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="mt-2 line-clamp-2 font-medium">
          {bookmark.title ?? host}
        </h3>
        {bookmark.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {bookmark.description}
          </p>
        )}

        {bookmark.tags.length > 0 && (
          <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
            {bookmark.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
