"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagsInput } from "@/components/shared/tags-input";
import { Markdown } from "@/components/shared/markdown";
import { cn } from "@/lib/utils";
import { createNote, updateNote } from "../actions";
import type { NoteProjectOption, NoteWithRelations } from "../queries";

const NO_PROJECT = "__none__";

export function NoteDialog({
  open,
  onOpenChange,
  note,
  projects,
  tagSuggestions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteWithRelations | null;
  projects: NoteProjectOption[];
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(note);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [projectId, setProjectId] = useState(NO_PROJECT);
  const [tags, setTags] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setPinned(note?.pinned ?? false);
    setProjectId(note?.projectId ?? NO_PROJECT);
    setTags(note?.tags.map((t) => t.name) ?? []);
    setPreview(false);
  }, [open, note]);

  function submit() {
    start(async () => {
      const payload = {
        title,
        content,
        pinned,
        projectId: projectId === NO_PROJECT ? "" : projectId,
        tags,
      };
      const res = isEdit
        ? await updateNote({ ...payload, id: note!.id })
        : await createNote(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Заметка обновлена" : "Заметка создана");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Заметка" : "Новая заметка"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок"
            className="text-base font-medium"
            autoFocus
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Содержимое (Markdown)</Label>
              <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreview(false)}
                  className={cn(
                    "rounded px-2 py-0.5",
                    !preview && "bg-secondary text-secondary-foreground",
                  )}
                >
                  Текст
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(true)}
                  className={cn(
                    "rounded px-2 py-0.5",
                    preview && "bg-secondary text-secondary-foreground",
                  )}
                >
                  Превью
                </button>
              </div>
            </div>
            {preview ? (
              <div className="min-h-40 rounded-md border border-border px-3 py-2">
                {content.trim() ? (
                  <Markdown>{content}</Markdown>
                ) : (
                  <p className="text-sm text-muted-foreground">Пусто</p>
                )}
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Поддерживается Markdown: **жирный**, # заголовки, - списки…"
                rows={10}
                className="font-mono text-sm"
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Теги</Label>
              <TagsInput
                value={tags}
                onChange={setTags}
                suggestions={tagSuggestions}
              />
            </div>
            <div className="space-y-2">
              <Label>Проект</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROJECT}>Без проекта</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={pinned}
              onCheckedChange={(v) => setPinned(v === true)}
            />
            Закрепить заметку
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={pending || title.trim().length === 0}>
            {isEdit ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
