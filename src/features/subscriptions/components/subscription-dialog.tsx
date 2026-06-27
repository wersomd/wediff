"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { BillingCycle } from "@prisma/client";
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
import { createSubscription, updateSubscription } from "../actions";
import { BILLING_CYCLE_LABELS, BILLING_CYCLE_ORDER } from "../constants";
import { CURRENCIES } from "@/features/finances/money";
import type { SubscriptionRow } from "../queries";

export function SubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: SubscriptionRow | null;
  categories: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const listId = useId();
  const isEdit = Boolean(subscription);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("KZT");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [nextPaymentDate, setNextPaymentDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [reminder, setReminder] = useState("3");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(subscription?.name ?? "");
    setIcon(subscription?.icon ?? "");
    setAmount(subscription ? String(subscription.amount) : "");
    setCurrency(subscription?.currency ?? "KZT");
    setBillingCycle(subscription?.billingCycle ?? BillingCycle.MONTHLY);
    setNextPaymentDate(
      subscription
        ? format(subscription.nextPaymentDate, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    );
    setReminder(String(subscription?.reminderDaysBefore ?? 3));
    setUrl(subscription?.url ?? "");
    setCategory(subscription?.category?.name ?? "");
  }, [open, subscription]);

  function submit() {
    start(async () => {
      const payload = {
        name,
        icon,
        amount,
        currency,
        billingCycle,
        nextPaymentDate,
        reminderDaysBefore: reminder,
        url,
        category,
        active: subscription?.active ?? true,
      };
      const res = isEdit
        ? await updateSubscription({ ...payload, id: subscription!.id })
        : await createSubscription(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Подписка обновлена" : "Подписка добавлена");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Подписка" : "Новая подписка"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📺"
              className="w-16 text-center text-lg"
              maxLength={4}
              aria-label="Иконка"
            />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Netflix"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-amount">Сумма</Label>
              <Input
                id="sub-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Валюта</Label>
              <Select value={currency} onValueChange={setCurrency}>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Цикл оплаты</Label>
              <Select
                value={billingCycle}
                onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLE_ORDER.map((c) => (
                    <SelectItem key={c} value={c}>
                      {BILLING_CYCLE_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-next">Следующий платёж</Label>
              <Input
                id="sub-next"
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-reminder">Напомнить за (дней)</Label>
              <Input
                id="sub-reminder"
                type="number"
                min="0"
                max="60"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-category">Категория</Label>
              <Input
                id="sub-category"
                list={listId}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Например, Развлечения"
              />
              <datalist id={listId}>
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-url">Ссылка</Label>
            <Input
              id="sub-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… (необязательно)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button
            onClick={submit}
            disabled={pending || name.trim().length === 0 || Number(amount) <= 0}
          >
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
