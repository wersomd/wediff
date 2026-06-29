"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { DebtDirection } from "@prisma/client";
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
import { createDebt } from "../actions";
import { DEBT_DIRECTION_LABELS } from "../constants";
import type { AccountWithBalance } from "@/features/finances/queries";

export function DebtDialog({
  open,
  onOpenChange,
  accounts,
  counterpartyNames,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountWithBalance[];
  counterpartyNames: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const listId = useId();

  const activeAccounts = useMemo(
    () => accounts.filter((a) => !a.archived),
    [accounts],
  );

  const [counterparty, setCounterparty] = useState("");
  const [direction, setDirection] = useState<DebtDirection>(
    DebtDirection.I_OWE,
  );
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [borrowedOn, setBorrowedOn] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setCounterparty("");
    setDirection(DebtDirection.I_OWE);
    setAmount("");
    setAccountId(activeAccounts[0]?.id ?? "");
    setBorrowedOn(format(new Date(), "yyyy-MM-dd"));
    setDueDate("");
    setDescription("");
  }, [open, activeAccounts]);

  const selectedAccount = activeAccounts.find((a) => a.id === accountId);
  const currency = selectedAccount?.currency ?? "KZT";

  function submit() {
    start(async () => {
      const res = await createDebt({
        counterparty,
        direction,
        amount,
        currency,
        accountId,
        borrowedOn,
        dueDate,
        description,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Долг добавлен");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый долг</DialogTitle>
        </DialogHeader>

        {activeAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Сначала добавьте хотя бы один счёт в разделе «Финансы» — долг
            проводится через счёт.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Направление</Label>
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as DebtDirection)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DebtDirection).map((d) => (
                    <SelectItem key={d} value={d}>
                      {DEBT_DIRECTION_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="debt-cp">
                {direction === DebtDirection.I_OWE ? "Кому должен" : "Кто должен"}
              </Label>
              <Input
                id="debt-cp"
                list={listId}
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="Например, Арман"
                autoFocus
              />
              <datalist id={listId}>
                {counterpartyNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debt-amount">Сумма ({currency})</Label>
                <Input
                  id="debt-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Счёт</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} · {a.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debt-date">Дата</Label>
                <Input
                  id="debt-date"
                  type="date"
                  value={borrowedOn}
                  onChange={(e) => setBorrowedOn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-due">Срок (необязательно)</Label>
                <Input
                  id="debt-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="debt-desc">Комментарий</Label>
              <Textarea
                id="debt-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="За что / условия (необязательно)"
                rows={2}
              />
            </div>
          </div>
        )}

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
              activeAccounts.length === 0 ||
              counterparty.trim().length === 0 ||
              Number(amount) <= 0 ||
              !accountId
            }
          >
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
