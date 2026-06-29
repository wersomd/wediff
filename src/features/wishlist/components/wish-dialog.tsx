"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WishStatus, WishType } from "@prisma/client";
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
import { CURRENCIES } from "@/features/finances/money";
import { createWish, updateWish } from "../actions";
import {
  WISH_STATUS_LABELS,
  WISH_STATUS_ORDER,
  WISH_TYPE_LABELS,
  WISH_TYPE_ORDER,
} from "../constants";
import type { WishRow } from "../queries";

export function WishDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: WishRow | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(item);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<WishType>(WishType.OTHER);
  const [status, setStatus] = useState<WishStatus>(WishStatus.WANT);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [rating, setRating] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("KZT");

  useEffect(() => {
    if (!open) return;
    setTitle(item?.title ?? "");
    setType(item?.type ?? WishType.OTHER);
    setStatus(item?.status ?? WishStatus.WANT);
    setUrl(item?.url ?? "");
    setNote(item?.note ?? "");
    setRating(item?.rating != null ? String(item.rating) : "");
    setPrice(item?.price != null ? String(item.price) : "");
    setCurrency(item?.currency ?? "KZT");
  }, [open, item]);

  function submit() {
    start(async () => {
      const payload = {
        title,
        type,
        status,
        url,
        note,
        rating,
        price,
        currency,
      };
      const res = isEdit
        ? await updateWish({ ...payload, id: item!.id })
        : await createWish(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Сохранено" : "Добавлено");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Желание" : "Новое желание"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wish-title">Название</Label>
            <Input
              id="wish-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, «Дюна» или новые наушники"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select value={type} onValueChange={(v) => setType(v as WishType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WISH_TYPE_ORDER.map((t) => (
                    <SelectItem key={t} value={t}>
                      {WISH_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as WishStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WISH_STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {WISH_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wish-price">Цена</Label>
              <Input
                id="wish-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="—"
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
            <div className="space-y-2">
              <Label htmlFor="wish-rating">Оценка</Label>
              <Input
                id="wish-rating"
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="1–5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wish-url">Ссылка</Label>
            <Input
              id="wish-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… (необязательно)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wish-note">Заметка</Label>
            <Textarea
              id="wish-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Необязательно"
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
          <Button onClick={submit} disabled={pending || title.trim().length === 0}>
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
