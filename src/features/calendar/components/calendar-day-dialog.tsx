"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { dateLabel, eventTime } from "@/lib/workspace-date";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { createCalendarEvent, deleteCalendarEvent } from "../actions";
import { CALENDAR_ITEM_ICON, CALENDAR_ITEM_LABEL } from "../constants";
import type { CalendarItem } from "../queries";

export function CalendarDayDialog({
  date,
  initiallyAdding = false,
  items,
  onOpenChange,
}: {
  date: Date | null;
  initiallyAdding?: boolean;
  items: CalendarItem[];
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [note, setNote] = useState("");

  useEffect(() => {
    setAdding(initiallyAdding);
    setTitle("");
    setTime("09:00");
    setNote("");
  }, [date, initiallyAdding]);

  if (!date) return null;

  function submit() {
    start(async () => {
      try {
      const res = await createCalendarEvent({
        title,
        date: format(date as Date, "yyyy-MM-dd"),
        time,
        note,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Событие добавлено");
      setAdding(false);
      setTitle("");
      setTime("09:00");
      setNote("");
      router.refresh();
      } catch { toast.error("Не удалось сохранить событие. Попробуйте ещё раз."); }
    });
  }

  function remove(eventId: string) {
    start(async () => {
      const res = await deleteCalendarEvent(eventId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {format(date, "EEEE, d MMMM", { locale: ru })}
          </DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            На этот день ничего не запланировано.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {items.map((item) => {
              const Icon = CALENDAR_ITEM_ICON[item.kind];
              return (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <Link href={item.href} className="block truncate text-sm hover:underline">
                      {item.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {CALENDAR_ITEM_LABEL[item.kind]} · {item.kind === "event" ? eventTime(item.date) : dateLabel(item.date)}
                      {item.meta ? ` · ${item.meta}` : ""}
                    </span>
                  </div>
                  {item.kind === "event" && (
                    <button
                      type="button"
                      onClick={() => remove(item.id.replace(/^event-/, ""))}
                      className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                      disabled={pending}
                    >
                      Удалить
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {adding && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Название</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например, стоматолог"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-time">Время</Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-note">Заметка</Label>
              <Textarea
                id="event-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Необязательно"
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {adding ? (
            <>
              <Button variant="ghost" onClick={() => setAdding(false)} disabled={pending}>
                Отмена
              </Button>
              <Button onClick={submit} disabled={pending || !title.trim()}>
                Добавить
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Добавить событие
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
