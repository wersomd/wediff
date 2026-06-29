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
import { createGoal, updateGoal } from "../actions";
import type { GoalRow } from "../queries";

export function GoalDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalRow | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(goal);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [unit, setUnit] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? "");
    setDescription(goal?.description ?? "");
    setTargetValue(goal?.targetValue != null ? String(goal.targetValue) : "");
    setCurrentValue(goal ? String(goal.currentValue) : "");
    setUnit(goal?.unit ?? "");
    setDueDate(goal?.dueDate ? format(goal.dueDate, "yyyy-MM-dd") : "");
  }, [open, goal]);

  function submit() {
    start(async () => {
      const payload = {
        title,
        description,
        targetValue,
        currentValue,
        unit,
        dueDate,
      };
      const res = isEdit
        ? await updateGoal({ ...payload, id: goal!.id })
        : await createGoal(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Цель обновлена" : "Цель добавлена");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Цель" : "Новая цель"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Название</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, Прочитать 12 книг"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="goal-current">Сейчас</Label>
              <Input
                id="goal-current"
                type="number"
                step="0.01"
                min="0"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-target">Цель</Label>
              <Input
                id="goal-target"
                type="number"
                step="0.01"
                min="0"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-unit">Ед.</Label>
              <Input
                id="goal-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="книг"
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-due">Срок (необязательно)</Label>
            <Input
              id="goal-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-desc">Описание</Label>
            <Textarea
              id="goal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Зачем и как (необязательно)"
              rows={2}
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
          <Button onClick={submit} disabled={pending || title.trim().length === 0}>
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
