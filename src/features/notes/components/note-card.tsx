"use client";

import { MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { NoteWithRelations } from "../queries";

// Rough plain-text preview: drop the most common markdown markers.
function stripMarkdown(md: string): string {
  return md
    .replace(/[#>*_`~-]/g, "")
    .replace(/\!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  note: NoteWithRelations;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const snippet = stripMarkdown(note.content);

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <button
        type="button"
        onClick={onEdit}
        className="absolute inset-0 rounded-xl"
        aria-label={note.title}
      />
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-medium">
          {note.pinned && <Pin className="size-3.5 text-primary" />}
          {note.title}
        </h3>
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
              <DropdownMenuItem onSelect={onTogglePin} className="cursor-pointer">
                {note.pinned ? (
                  <>
                    <PinOff className="size-4" />
                    Открепить
                  </>
                ) : (
                  <>
                    <Pin className="size-4" />
                    Закрепить
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

      {snippet && (
        <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">
          {snippet}
        </p>
      )}

      {(note.tags.length > 0 || note.project) && (
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-1.5">
          {note.project && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs text-muted-foreground",
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: note.project.color ?? "#8b5cf6" }}
              />
              {note.project.name}
            </span>
          )}
          {note.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              #{tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
