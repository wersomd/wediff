"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransfer } from "../actions";
import type { AccountWithBalance } from "../queries";

export function TransferDialog({
  open,
  onOpenChange,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountWithBalance[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!open) return;
    setFromAccountId(accounts[0]?.id ?? "");
    setToAccountId("");
    setAmount("");
    setDate(format(new Date(), "yyyy-MM-dd"));
  }, [open, accounts]);

  const from = accounts.find((a) => a.id === fromAccountId);
  // Only same-currency accounts can receive the transfer (no FX).
  const targets = useMemo(
    () => accounts.filter((a) => a.id !== fromAccountId && a.currency === from?.currency),
    [accounts, fromAccountId, from?.currency],
  );

  useEffect(() => {
    if (toAccountId && !targets.some((a) => a.id === toAccountId)) {
      setToAccountId("");
    }
  }, [targets, toAccountId]);

  function submit() {
    start(async () => {
      const res = await createTransfer({
        fromAccountId,
        toAccountId,
        amount,
        date,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Перевод выполнен");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Перевод между счетами</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label>Со счёта</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {a.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ArrowRight className="mb-2.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-2">
              <Label>На счёт</Label>
              <Select
                value={toAccountId}
                onValueChange={setToAccountId}
                disabled={targets.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {a.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {targets.length === 0 && from && (
            <p className="text-xs text-muted-foreground">
              Нет другого счёта в валюте {from.currency}.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tr-amount">
                Сумма{from ? ` (${from.currency})` : ""}
              </Label>
              <Input
                id="tr-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-date">Дата</Label>
              <Input
                id="tr-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
          <Button
            onClick={submit}
            disabled={
              pending ||
              !fromAccountId ||
              !toAccountId ||
              Number(amount) <= 0
            }
          >
            Перевести
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
