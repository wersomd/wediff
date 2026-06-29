"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { saveJournalEntry } from "../actions";
import { MOODS, MOOD_EMOJI, MOOD_LABEL } from "../constants";
import type { JournalEntryRow } from "../queries";

export function JournalDialog({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: JournalEntryRow | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(entry);

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mood, setMood] = useState<number | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(entry ? format(entry.date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    setMood(entry?.mood ?? null);
    setContent(entry?.content ?? "");
  }, [open, entry]);

  function submit() {
    start(async () => {
      const res = await saveJournalEntry({
        id: entry?.id,
        date,
        mood: mood ?? "",
        content,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Запись сохранена");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Запись" : "Новая запись"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="journal-date">Дата</Label>
            <Input
              id="journal-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isEdit}
            />
          </div>

          <div className="space-y-2">
            <Label>Настроение</Label>
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? null : m)}
                  title={MOOD_LABEL[m]}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-lg border text-xl transition",
                    mood === m
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {MOOD_EMOJI[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="journal-content">Как прошёл день</Label>
            <Textarea
              id="journal-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Поддерживается markdown…"
              rows={8}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Отмена
          </Button>
          <Button
            onClick={submit}
            disabled={pending || (content.trim().length === 0 && mood === null)}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
