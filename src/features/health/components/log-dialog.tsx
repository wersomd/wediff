"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { deleteLog, saveLog } from "../actions";
import type { HealthMetricRow } from "../queries";

export function LogDialog({
  metric,
  onOpenChange,
}: {
  metric: HealthMetricRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!metric) return;
    setDate(format(new Date(), "yyyy-MM-dd"));
    setValue(metric.latest ? String(metric.latest.value) : "");
  }, [metric]);

  if (!metric) return null;

  function submit() {
    if (!metric) return;
    start(async () => {
      const res = await saveLog({ metricId: metric.id, date, value });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Записано");
      onOpenChange(false);
      router.refresh();
    });
  }

  function removeLog(id: string) {
    start(async () => {
      const res = await deleteLog(id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  const recent = [...metric.logs].reverse().slice(0, 7);

  return (
    <Dialog open={Boolean(metric)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {metric.icon ? `${metric.icon} ` : ""}
            {metric.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="log-value">
              Значение{metric.unit ? `, ${metric.unit}` : ""}
            </Label>
            <Input
              id="log-value"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="log-date">Дата</Label>
            <Input
              id="log-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {recent.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Недавнее</p>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {recent.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="tabular-nums">
                    {l.value}
                    {metric.unit ? ` ${metric.unit}` : ""}
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    {format(l.date, "d MMM", { locale: ru })}
                    <button
                      type="button"
                      onClick={() => removeLog(l.id)}
                      disabled={pending}
                      className="rounded-md p-1 hover:bg-accent hover:text-destructive disabled:opacity-50"
                      aria-label="Удалить запись"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Закрыть
          </Button>
          <Button onClick={submit} disabled={pending || value.trim() === ""}>
            Записать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
