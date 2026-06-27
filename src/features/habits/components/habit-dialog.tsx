"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HabitFrequency } from "@prisma/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createHabit, updateHabit } from "../actions";
import {
  DEFAULT_HABIT_COLOR,
  HABIT_COLORS,
  HABIT_FREQUENCY_LABELS,
} from "../constants";
import type { HabitWithEntries } from "../queries";

export function HabitDialog({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: HabitWithEntries | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(habit);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [frequency, setFrequency] = useState<HabitFrequency>(HabitFrequency.DAILY);
  const [target, setTarget] = useState(3);

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? "");
    setDescription(habit?.description ?? "");
    setIcon(habit?.icon ?? "");
    setColor(habit?.color ?? DEFAULT_HABIT_COLOR);
    setFrequency(habit?.frequency ?? HabitFrequency.DAILY);
    setTarget(habit?.target ?? 3);
  }, [open, habit]);

  const isWeekly = frequency === HabitFrequency.WEEKLY;

  function submit() {
    start(async () => {
      const payload = {
        name,
        description,
        icon,
        color,
        frequency,
        target: isWeekly ? target : 1,
      };
      const res = isEdit
        ? await updateHabit({ ...payload, id: habit!.id })
        : await createHabit(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Привычка обновлена" : "Привычка создана");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Привычка" : "Новая привычка"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🏃"
              className="w-16 text-center text-lg"
              maxLength={4}
              aria-label="Иконка (эмодзи)"
            />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Зарядка"
              autoFocus
            />
          </div>

          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание (необязательно)"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Частота</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as HabitFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(HabitFrequency).map((f) => (
                    <SelectItem key={f} value={f}>
                      {HABIT_FREQUENCY_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isWeekly && (
              <div className="space-y-2">
                <Label htmlFor="habit-target">Цель в неделю</Label>
                <Input
                  id="habit-target"
                  type="number"
                  min={1}
                  max={7}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Цвет</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Цвет ${c}`}
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform",
                    color === c
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-110",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={pending || name.trim().length === 0}>
            {isEdit ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
