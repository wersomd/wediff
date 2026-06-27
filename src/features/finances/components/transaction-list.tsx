"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { TransactionType } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatMoney } from "../money";
import type { TransactionRow } from "../queries";

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: TransactionRow[];
  onEdit: (t: TransactionRow) => void;
  onDelete: (t: TransactionRow) => void;
}) {
  return (
    <div className="rounded-xl border border-border">
      {transactions.map((t) => {
        const income = t.type === TransactionType.INCOME;
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 hover:bg-accent/40"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                income
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {income ? (
                <ArrowDownLeft className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
            </span>

            <button
              type="button"
              onClick={() => onEdit(t)}
              className="flex min-w-0 flex-1 flex-col text-left"
            >
              <span className="truncate text-sm">
                {t.category?.name ?? (income ? "Доход" : "Расход")}
                {t.note ? <span className="text-muted-foreground"> · {t.note}</span> : null}
              </span>
              <span className="text-xs text-muted-foreground">
                {t.account.name} · {format(t.date, "d MMM", { locale: ru })}
              </span>
            </button>

            <span
              className={cn(
                "shrink-0 text-sm font-medium tabular-nums",
                income ? "text-emerald-500" : "text-foreground",
              )}
            >
              {income ? "+" : "−"}
              {formatMoney(t.amount, t.account.currency)}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-md p-1 text-muted-foreground outline-none hover:bg-accent"
                aria-label="Действия"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(t)} className="cursor-pointer">
                  <Pencil className="size-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDelete(t)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}
