"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountType } from "@prisma/client";
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
import { createAccount, updateAccount } from "../actions";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ORDER } from "../constants";
import { CURRENCIES } from "../money";
import type { AccountWithBalance } from "../queries";

export function AccountDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountWithBalance | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(account);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>(AccountType.CARD);
  const [currency, setCurrency] = useState<string>("KZT");
  const [startBalance, setStartBalance] = useState("0");

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setType(account?.type ?? AccountType.CARD);
    setCurrency(account?.currency ?? "KZT");
    setStartBalance(account ? String(account.startBalance) : "0");
  }, [open, account]);

  function submit() {
    start(async () => {
      const payload = { name, type, currency, startBalance };
      const res = isEdit
        ? await updateAccount({ ...payload, id: account!.id })
        : await createAccount(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Счёт обновлён" : "Счёт создан");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Счёт" : "Новый счёт"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acc-name">Название</Label>
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Kaspi Gold"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_ORDER.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ACCOUNT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="space-y-2">
            <Label htmlFor="acc-start">Начальный баланс</Label>
            <Input
              id="acc-start"
              type="number"
              step="0.01"
              value={startBalance}
              onChange={(e) => setStartBalance(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={pending || name.trim().length === 0}>
            {isEdit ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
