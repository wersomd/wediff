"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { HabitRow } from "./habit-row";
import { HabitDialog } from "./habit-dialog";
import {
  deleteHabit,
  setHabitArchived,
  toggleHabitEntry,
} from "../actions";
import { entryDayKey } from "../dates";
import type { HabitWithEntries } from "../queries";

function buildDoneMap(habits: HabitWithEntries[]): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};
  for (const h of habits) {
    map[h.id] = new Set(h.entries.map((e) => entryDayKey(e.date)));
  }
  return map;
}

export function HabitsView({ habits }: { habits: HabitWithEntries[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [done, setDone] = useState<Record<string, Set<string>>>(() =>
    buildDoneMap(habits),
  );
  const [filter, setFilter] = useState("active"); // active | archived | all
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HabitWithEntries | null>(null);

  useEffect(() => {
    setDone(buildDoneMap(habits));
  }, [habits]);

  const visible = useMemo(
    () =>
      habits.filter((h) => {
        if (filter === "active") return !h.archived;
        if (filter === "archived") return h.archived;
        return true;
      }),
    [habits, filter],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function toggle(habitId: string, dayKey: string) {
    // optimistic
    setDone((prev) => {
      const next = { ...prev };
      const set = new Set(next[habitId] ?? []);
      if (set.has(dayKey)) set.delete(dayKey);
      else set.add(dayKey);
      next[habitId] = set;
      return next;
    });
    start(async () => {
      const res = await toggleHabitEntry({ habitId, date: dayKey });
      if ("error" in res) {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  function archive(h: HabitWithEntries) {
    start(async () => {
      const res = await setHabitArchived(h.id, !h.archived);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(h: HabitWithEntries) {
    if (!window.confirm(`Удалить привычку «${h.name}» со всей историей?`)) return;
    start(async () => {
      const res = await deleteHabit(h.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Привычка удалена");
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Привычки"
        description="Ежедневные и недельные привычки со стриками и прогрессом."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Новая привычка
          </Button>
        }
      />

      <div className="mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="archived">В архиве</SelectItem>
            <SelectItem value="all">Все</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={habits.length === 0 ? "Пока нет привычек" : "Ничего не найдено"}
          description={
            habits.length === 0
              ? "Создайте первую привычку и отмечайте её каждый день."
              : "Измените фильтр."
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              done={done[h.id] ?? new Set()}
              onToggle={(dayKey) => toggle(h.id, dayKey)}
              onEdit={() => {
                setEditing(h);
                setDialogOpen(true);
              }}
              onArchive={() => archive(h)}
              onDelete={() => remove(h)}
            />
          ))}
        </div>
      )}

      <HabitDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editing} />
    </>
  );
}
