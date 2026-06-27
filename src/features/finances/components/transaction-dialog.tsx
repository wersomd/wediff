"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { TransactionType } from "@prisma/client";
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
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "../actions";
import { TRANSACTION_TYPE_LABELS } from "../constants";
import type {
  AccountWithBalance,
  CategoryOption,
  TransactionRow,
} from "../queries";

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionRow | null;
  accounts: AccountWithBalance[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const listId = useId();
  const isEdit = Boolean(transaction);

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setType(transaction?.type ?? TransactionType.EXPENSE);
    setAmount(transaction ? String(transaction.amount) : "");
    setDate(
      transaction
        ? format(transaction.date, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    );
    setAccountId(transaction?.account.id ?? accounts[0]?.id ?? "");
    setCategory(transaction?.category?.name ?? "");
    setNote(transaction?.note ?? "");
  }, [open, transaction, accounts]);

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.type === type).map((c) => c.name),
    [categories, type],
  );

  function submit() {
    start(async () => {
      const payload = { type, amount, date, accountId, category, note };
      const res = isEdit
        ? await updateTransaction({ ...payload, id: transaction!.id })
        : await createTransaction(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Транзакция обновлена" : "Транзакция добавлена");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Транзакция" : "Новая транзакция"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {(
              [TransactionType.EXPENSE, TransactionType.INCOME] as const
            ).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  type === t
                    ? t === TransactionType.INCOME
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-destructive/15 text-destructive"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {TRANSACTION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Сумма</Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-date">Дата</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Счёт</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите счёт" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-category">Категория</Label>
            <Input
              id="tx-category"
              list={listId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Например, Продукты"
            />
            <datalist id={listId}>
              {categoryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-note">Заметка</Label>
            <Input
              id="tx-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Необязательно"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button
            onClick={submit}
            disabled={pending || !accountId || Number(amount) <= 0}
          >
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
