"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { createCategory, updateCategory } from "../actions";
import type { CategoryWithCount } from "../queries";

const PALETTE = [
  "#ef4444","#f97316","#eab308","#22c55e","#10b981",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899","#64748b",
  "#a16207","#7c3aed",
];

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryWithCount | null;
  defaultType: TransactionType;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(category);

  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[6]); // blue default

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setColor(category?.color ?? PALETTE[6]);
  }, [open, category]);

  function submit() {
    start(async () => {
      const payload = isEdit
        ? { id: category!.id, name, type: category!.type, color }
        : { name, type: defaultType, color };

      const res = isEdit ? await updateCategory(payload) : await createCategory(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Категория обновлена" : "Категория добавлена");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Название</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Продукты"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Цвет</Label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110",
                    color === c ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span
                className="size-7 shrink-0 rounded-full border border-border"
                style={{ background: color }}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
