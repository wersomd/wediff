"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateDebt } from "../actions";
import type { DebtView } from "../queries";

export function DebtDatesDialog({
  debt,
  onOpenChange,
}: {
  debt: DebtView | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [borrowedOn, setBorrowedOn] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!debt) return;
    setBorrowedOn(format(debt.borrowedOn, "yyyy-MM-dd"));
    setDueDate(debt.dueDate ? format(debt.dueDate, "yyyy-MM-dd") : "");
  }, [debt]);

  function submit() {
    if (!debt) return;
    start(async () => {
      const res = await updateDebt({ id: debt.id, borrowedOn, dueDate });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Даты обновлены");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={debt !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Изменить даты</DialogTitle>
          <DialogDescription>
            Дата взятия синхронизируется с проводкой в «Финансах».
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-borrowed">Дата взятия</Label>
            <Input
              id="edit-borrowed"
              type="date"
              value={borrowedOn}
              onChange={(e) => setBorrowedOn(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-due">Срок (необязательно)</Label>
            <Input
              id="edit-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
          <Button onClick={submit} disabled={pending || !borrowedOn}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
