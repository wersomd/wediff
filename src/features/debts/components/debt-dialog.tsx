"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMonths, format } from "date-fns";
import { toast } from "sonner";
import { DebtDirection, DebtKind } from "@prisma/client";
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
import { DEBT_DIRECTION_LABELS, DEBT_KIND_LABELS } from "../constants";
import type { AccountWithBalance } from "@/features/finances/queries";

const CURRENCIES = ["KZT", "USD"] as const;

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
  const [kind, setKind] = useState<DebtKind>(DebtKind.SIMPLE);
  const [direction, setDirection] = useState<DebtDirection>(
    DebtDirection.I_OWE,
  );
  const [amount, setAmount] = useState("");
  const [affectsBalance, setAffectsBalance] = useState(true);
  const [accountId, setAccountId] = useState("");
  const [manualCurrency, setManualCurrency] = useState<string>("KZT");
  const [borrowedOn, setBorrowedOn] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [termMonths, setTermMonths] = useState("6");
  const [firstPaymentDate, setFirstPaymentDate] = useState(
    format(addMonths(new Date(), 1), "yyyy-MM-dd"),
  );

  useEffect(() => {
    if (!open) return;
    setCounterparty("");
    setKind(DebtKind.SIMPLE);
    setDirection(DebtDirection.I_OWE);
    setAmount("");
    setAffectsBalance(true);
    setAccountId(activeAccounts[0]?.id ?? "");
    setManualCurrency("KZT");
    setBorrowedOn(format(new Date(), "yyyy-MM-dd"));
    setDueDate("");
    setDescription("");
    setTermMonths("6");
    setFirstPaymentDate(format(addMonths(new Date(), 1), "yyyy-MM-dd"));
  }, [open, activeAccounts]);

  const isInstallment = kind === DebtKind.INSTALLMENT;
  // The debt posts to an account only for a simple debt with the toggle on.
  const posts = !isInstallment && affectsBalance;

  const selectedAccount = activeAccounts.find((a) => a.id === accountId);
  const currency = posts
    ? (selectedAccount?.currency ?? "KZT")
    : manualCurrency;

  // Live preview of the monthly installment (for reassurance in the form).
  const monthly = useMemo(() => {
    const total = Number(amount);
    const n = Number(termMonths);
    if (!isInstallment || !(total > 0) || !(n >= 1)) return null;
    return Math.round((total / n) * 100) / 100;
  }, [amount, termMonths, isInstallment]);

  function submit() {
    start(async () => {
      const res = await createDebt({
        counterparty,
        kind,
        direction: isInstallment ? DebtDirection.I_OWE : direction,
        amount,
        currency,
        affectsBalance,
        accountId: posts ? accountId : "",
        borrowedOn,
        dueDate: isInstallment ? "" : dueDate,
        description,
        termMonths: isInstallment ? termMonths : undefined,
        firstPaymentDate: isInstallment ? firstPaymentDate : undefined,
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

  const canSubmit =
    counterparty.trim().length > 0 &&
    Number(amount) > 0 &&
    (!posts || Boolean(accountId)) &&
    (!isInstallment || Number(termMonths) >= 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый долг</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as DebtKind)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DebtKind).map((k) => (
                    <SelectItem key={k} value={k}>
                      {DEBT_KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Направление</Label>
              <Select
                value={isInstallment ? DebtDirection.I_OWE : direction}
                onValueChange={(v) => setDirection(v as DebtDirection)}
                disabled={isInstallment}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="debt-cp">
              {isInstallment
                ? "Магазин / кредитор"
                : direction === DebtDirection.I_OWE
                  ? "Кому должен"
                  : "Кто должен"}
            </Label>
            <Input
              id="debt-cp"
              list={listId}
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              placeholder={isInstallment ? "Например, Kaspi" : "Например, Арман"}
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
              <Label htmlFor="debt-amount">
                {isInstallment ? "Полная сумма" : "Сумма"} ({currency})
              </Label>
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
            {posts ? (
              <div className="space-y-2">
                <Label>Счёт</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите счёт" />
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
            ) : (
              <div className="space-y-2">
                <Label>Валюта</Label>
                <Select value={manualCurrency} onValueChange={setManualCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Balance toggle — simple debts only. */}
          {!isInstallment && (
            <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={affectsBalance}
                onChange={(e) => setAffectsBalance(e.target.checked)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                <span className="font-medium">Провести через счёт</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Выключите для старых долгов — деньги давно получены и в текущем
                  балансе их уже нет.
                </span>
              </span>
            </label>
          )}

          {isInstallment ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debt-term">Срок (месяцев)</Label>
                <Input
                  id="debt-term"
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                />
                {monthly !== null && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {monthly.toLocaleString("ru-RU")} {currency} / мес
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-first">Первый платёж</Label>
                <Input
                  id="debt-first"
                  type="date"
                  value={firstPaymentDate}
                  onChange={(e) => setFirstPaymentDate(e.target.value)}
                />
              </div>
            </div>
          ) : (
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
          )}

          {isInstallment && (
            <div className="space-y-2">
              <Label htmlFor="debt-purchase">Дата покупки</Label>
              <Input
                id="debt-purchase"
                type="date"
                value={borrowedOn}
                onChange={(e) => setBorrowedOn(e.target.value)}
              />
            </div>
          )}

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

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Отмена
          </Button>
          <Button onClick={submit} disabled={pending || !canSubmit}>
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
