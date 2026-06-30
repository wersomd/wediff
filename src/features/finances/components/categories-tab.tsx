"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { TransactionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteCategory } from "../actions";
import { CategoryDialog } from "./category-dialog";
import type { CategoryWithCount } from "../queries";

export function CategoriesTab({ categories }: { categories: CategoryWithCount[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryWithCount | null>(null);

  const SYSTEM_CATEGORIES = ["Перевод"];

  const filtered = categories.filter(
    (c) => c.type === type && !SYSTEM_CATEGORIES.includes(c.name),
  );

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(c: CategoryWithCount) {
    setEditing(c);
    setDialogOpen(true);
  }

  function remove(c: CategoryWithCount) {
    if (c._count.transactions > 0) {
      toast.error(`Нельзя удалить: используется в ${c._count.transactions} транзакциях`);
      return;
    }
    if (!window.confirm(`Удалить категорию «${c.name}»?`)) return;
    start(async () => {
      const res = await deleteCategory(c.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Категория удалена");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Type toggle */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {([TransactionType.EXPENSE, TransactionType.INCOME] as const).map((t) => (
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
              {t === TransactionType.EXPENSE ? "Расходы" : "Доходы"}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="size-4" />
          Категория
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Нет категорий. Создайте первую.
        </p>
      ) : (
        <div className="rounded-xl border border-border">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border-b border-border px-3 py-3 last:border-0"
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: c.color ?? "#6b7280" }}
              />
              <span className="flex-1 text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c._count.transactions} транз.
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Редактировать"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                  aria-label="Удалить"
                  disabled={c._count.transactions > 0}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        defaultType={type}
      />
    </div>
  );
}
