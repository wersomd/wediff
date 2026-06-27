"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, StickyNote } from "lucide-react";
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
import { NoteCard } from "./note-card";
import { NoteDialog } from "./note-dialog";
import { deleteNote, toggleNotePin } from "../actions";
import type { NoteProjectOption, NoteWithRelations } from "../queries";

const ALL_TAGS = "ALL";

export function NotesView({
  initialNotes,
  projects,
  tags,
}: {
  initialNotes: NoteWithRelations[];
  projects: NoteProjectOption[];
  tags: string[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState(ALL_TAGS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NoteWithRelations | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialNotes.filter((note) => {
      if (
        q &&
        !note.title.toLowerCase().includes(q) &&
        !note.content.toLowerCase().includes(q)
      )
        return false;
      if (
        tagFilter !== ALL_TAGS &&
        !note.tags.some((t) => t.name === tagFilter)
      )
        return false;
      return true;
    });
  }, [initialNotes, query, tagFilter]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function remove(note: NoteWithRelations) {
    if (!window.confirm(`Удалить заметку «${note.title}»?`)) return;
    start(async () => {
      const res = await deleteNote(note.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Заметка удалена");
      router.refresh();
    });
  }

  function togglePin(note: NoteWithRelations) {
    start(async () => {
      const res = await toggleNotePin(note.id, !note.pinned);
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
        title="Notes"
        description="Заметки в Markdown с тегами и привязкой к проектам."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Новая заметка
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
        {tags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TAGS}>Все теги</SelectItem>
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
          icon={StickyNote}
          title={initialNotes.length === 0 ? "Пока нет заметок" : "Ничего не найдено"}
          description={
            initialNotes.length === 0
              ? "Создайте первую заметку — поддерживается Markdown."
              : "Измените поиск или фильтр по тегу."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => {
                setEditing(note);
                setDialogOpen(true);
              }}
              onDelete={() => remove(note)}
              onTogglePin={() => togglePin(note)}
            />
          ))}
        </div>
      )}

      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        note={editing}
        projects={projects}
        tagSuggestions={tags}
      />
    </>
  );
}
