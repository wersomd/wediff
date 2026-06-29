"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/features/finances/money";
import { addPayment, deletePayment } from "../actions";
import { DEBT_DIRECTION_LABELS } from "../constants";
import type { DebtView } from "../queries";
import type { AccountWithBalance } from "@/features/finances/queries";

export function PaymentDialog({
  debt,
  accounts,
  onOpenChange,
}: {
  debt: DebtView | null;
  accounts: AccountWithBalance[];
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const matchingAccounts = useMemo(
    () =>
      accounts.filter((a) => !a.archived && a.currency === debt?.currency),
    [accounts, debt?.currency],
  );

  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paidOn, setPaidOn] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!debt) return;
    setAmount(debt.remaining > 0 ? String(debt.remaining) : "");
    setAccountId(matchingAccounts[0]?.id ?? "");
    setPaidOn(format(new Date(), "yyyy-MM-dd"));
  }, [debt, matchingAccounts]);

  if (!debt) return null;

  function submit() {
    if (!debt) return;
    start(async () => {
      const res = await addPayment({
        debtId: debt.id,
        amount,
        accountId,
        paidOn,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Погашение записано");
      onOpenChange(false);
      router.refresh();
    });
  }

  function removePayment(id: string) {
    start(async () => {
      const res = await deletePayment(id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Платёж удалён");
      router.refresh();
    });
  }

  return (
    <Dialog open={Boolean(debt)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Погашение долга</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            {DEBT_DIRECTION_LABELS[debt.direction]}
            {debt.description ? ` · ${debt.description}` : ""}
          </p>
          <p className="mt-1 font-medium tabular-nums">
            Остаток: {formatMoney(debt.remaining, debt.currency)}
            <span className="text-muted-foreground">
              {" "}
              из {formatMoney(debt.principal, debt.currency)}
            </span>
          </p>
        </div>

        {debt.status === "PAID" ? (
          <p className="text-sm text-muted-foreground">
            Долг полностью погашен.
          </p>
        ) : matchingAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Нет счёта в валюте {debt.currency}. Добавьте такой счёт в «Финансах».
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay-amount">Сумма ({debt.currency})</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={debt.remaining}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-date">Дата</Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={paidOn}
                  onChange={(e) => setPaidOn(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Счёт</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {matchingAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {a.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {debt.payments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              История погашений
            </p>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {debt.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="tabular-nums">
                    {formatMoney(p.amount, debt.currency)}
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    {format(p.paidOn, "d MMM yyyy", { locale: ru })}
                    <button
                      type="button"
                      onClick={() => removePayment(p.id)}
                      disabled={pending}
                      className="rounded-md p-1 hover:bg-accent hover:text-destructive disabled:opacity-50"
                      aria-label="Удалить платёж"
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
          {debt.status === "OPEN" && matchingAccounts.length > 0 && (
            <Button
              onClick={submit}
              disabled={
                pending ||
                Number(amount) <= 0 ||
                Number(amount) > debt.remaining + 1e-6 ||
                !accountId
              }
            >
              Записать
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
