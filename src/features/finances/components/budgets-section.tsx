"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { formatMoney } from "../money";
import { deleteBudget, setBudget } from "../actions";
import type { BudgetRow, CategoryOption } from "../queries";

export function BudgetsSection({
  budgets,
  categories,
}: {
  budgets: BudgetRow[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === TransactionType.EXPENSE),
    [categories],
  );

  function remove(categoryId: string) {
    start(async () => {
      const res = await deleteBudget(categoryId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Бюджеты на месяц</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={expenseCategories.length === 0}
        >
          <Plus className="size-4" />
          Бюджет
        </Button>
      </div>

      {budgets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Лимитов пока нет. Задайте бюджет по категории расходов — увидите
          прогресс «потрачено / лимит» за текущий месяц.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const pct = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0;
            const over = b.spent > b.amount;
            return (
              <div
                key={b.categoryId}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <span className="font-medium">{b.category.name}</span>
                  <button
                    type="button"
                    onClick={() => remove(b.categoryId)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                    aria-label="Удалить бюджет"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-sm tabular-nums">
                  <span className={cn("font-semibold", over && "text-destructive")}>
                    {formatMoney(b.spent, "KZT")}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    / {formatMoney(b.amount, "KZT")}
                  </span>
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      over ? "bg-destructive" : "bg-primary",
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={expenseCategories}
        budgeted={budgets.map((b) => b.categoryId)}
      />
    </div>
  );
}

function BudgetDialog({
  open,
  onOpenChange,
  categories,
  budgeted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  budgeted: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");

  function submit() {
    start(async () => {
      const res = await setBudget({ categoryId, amount });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Бюджет сохранён");
      onOpenChange(false);
      setCategoryId("");
      setAmount("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Бюджет по категории</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Категория расходов</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {budgeted.includes(c.id) ? " (есть лимит)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-amount">Лимит в месяц (KZT)</Label>
            <Input
              id="budget-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
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
          <Button
            onClick={submit}
            disabled={pending || !categoryId || Number(amount) <= 0}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
