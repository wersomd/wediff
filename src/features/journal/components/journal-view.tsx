"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { BookOpen, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Markdown } from "@/components/shared/markdown";
import { JournalDialog } from "./journal-dialog";
import { deleteJournalEntry } from "../actions";
import { MOOD_EMOJI, MOOD_LABEL } from "../constants";
import type { JournalEntryRow } from "../queries";

export function JournalView({
  entries,
  stats,
}: {
  entries: JournalEntryRow[];
  stats: { avgMood: number | null; ratedDays: number };
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntryRow | null>(null);

  function remove(e: JournalEntryRow) {
    if (!window.confirm("Удалить запись?")) return;
    start(async () => {
      const res = await deleteJournalEntry(e.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Запись удалена");
      router.refresh();
    });
  }

  const avgEmoji =
    stats.avgMood != null ? MOOD_EMOJI[Math.round(stats.avgMood)] : null;

  return (
    <>
      <PageHeader
        title="Дневник"
        description="Запись на каждый день и трекер настроения."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Новая запись
          </Button>
        }
      />

      {stats.avgMood != null && (
        <div className="mb-6 inline-flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-2xl">{avgEmoji}</span>
          <div>
            <p className="text-xs text-muted-foreground">
              Среднее настроение (30 дней)
            </p>
            <p className="font-semibold">
              {stats.avgMood.toFixed(1)} / 5
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                · {stats.ratedDays} дн.
              </span>
            </p>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Дневник пуст"
          description="Сделайте первую запись — как прошёл день и с каким настроением."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {e.mood != null && (
                    <span className="text-xl" title={MOOD_LABEL[e.mood]}>
                      {MOOD_EMOJI[e.mood]}
                    </span>
                  )}
                  <h3 className="font-medium capitalize">
                    {format(e.date, "EEEE, d MMMM yyyy", { locale: ru })}
                  </h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="rounded-md p-1 text-muted-foreground outline-none hover:bg-accent"
                    aria-label="Действия"
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(e);
                        setDialogOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Pencil className="size-4" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => remove(e)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {e.content && (
                <Markdown className="mt-2 text-muted-foreground">
                  {e.content}
                </Markdown>
              )}
            </div>
          ))}
        </div>
      )}

      <JournalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
      />
    </>
  );
}
