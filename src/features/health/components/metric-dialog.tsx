"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createMetric, updateMetric } from "../actions";
import type { HealthMetricRow } from "../queries";

export function MetricDialog({
  open,
  onOpenChange,
  metric,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric?: HealthMetricRow | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(metric);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [icon, setIcon] = useState("");
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(metric?.name ?? "");
    setUnit(metric?.unit ?? "");
    setIcon(metric?.icon ?? "");
    setTarget(metric?.target != null ? String(metric.target) : "");
  }, [open, metric]);

  function submit() {
    start(async () => {
      const payload = { name, unit, icon, target };
      const res = isEdit
        ? await updateMetric({ ...payload, id: metric!.id })
        : await createMetric(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Метрика обновлена" : "Метрика добавлена");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Метрика" : "Новая метрика"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="⚖️"
              className="w-16 text-center text-lg"
              maxLength={4}
              aria-label="Иконка"
            />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Вес"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metric-unit">Единица</Label>
              <Input
                id="metric-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="кг"
                maxLength={12}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metric-target">Цель в день</Label>
              <Input
                id="metric-target"
                type="number"
                step="0.01"
                min="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="необязательно"
              />
            </div>
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
          <Button onClick={submit} disabled={pending || name.trim().length === 0}>
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
