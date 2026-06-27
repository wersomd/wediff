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
import { TagsInput } from "@/components/shared/tags-input";
import { createBookmark, updateBookmark } from "../actions";
import type { BookmarkWithTags } from "../queries";

export function BookmarkDialog({
  open,
  onOpenChange,
  bookmark,
  tagSuggestions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark?: BookmarkWithTags | null;
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(bookmark);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isArchived, setIsArchived] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setUrl(bookmark?.url ?? "");
    setTitle(bookmark?.title ?? "");
    setDescription(bookmark?.description ?? "");
    setIsArchived(bookmark?.isArchived ?? false);
    setTags(bookmark?.tags.map((t) => t.name) ?? []);
  }, [open, bookmark]);

  function submit() {
    start(async () => {
      const payload = { url, title, description, isArchived, tags };
      const res = isEdit
        ? await updateBookmark({ ...payload, id: bookmark!.id })
        : await createBookmark(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Ссылка обновлена" : "Ссылка добавлена");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ссылка" : "Новая ссылка"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bm-url">URL</Label>
            <Input
              id="bm-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… или ссылка на YouTube"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bm-title">Название</Label>
            <Input
              id="bm-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Необязательно — подставим домен"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bm-desc">Описание</Label>
            <Textarea
              id="bm-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Необязательно"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Теги</Label>
            <TagsInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isArchived}
              onCheckedChange={(v) => setIsArchived(v === true)}
            />
            В архиве (прочитано / просмотрено)
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={pending || url.trim().length === 0}>
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
