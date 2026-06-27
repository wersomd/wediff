"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { AccountDialog } from "./account-dialog";
import { TransactionDialog } from "./transaction-dialog";
import { TransactionList } from "./transaction-list";
import {
  deleteAccount,
  deleteTransaction,
  setAccountArchived,
} from "../actions";
import { ACCOUNT_TYPE_LABELS } from "../constants";
import { formatMoney } from "../money";
import type {
  AccountWithBalance,
  CategoryOption,
  TransactionRow,
} from "../queries";

const ALL = "ALL";

export function FinancesView({
  accounts,
  transactions,
  categories,
}: {
  accounts: AccountWithBalance[];
  transactions: TransactionRow[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [accountDialog, setAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithBalance | null>(null);
  const [txDialog, setTxDialog] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionRow | null>(null);
  const [accFilter, setAccFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);

  const activeAccounts = accounts.filter((a) => !a.archived);

  const filteredTx = useMemo(
    () =>
      transactions.filter((t) => {
        if (accFilter !== ALL && t.account.id !== accFilter) return false;
        if (typeFilter !== ALL && t.type !== typeFilter) return false;
        return true;
      }),
    [transactions, accFilter, typeFilter],
  );

  function removeAccount(a: AccountWithBalance) {
    if (
      !window.confirm(
        `Удалить счёт «${a.name}»? Все его транзакции тоже будут удалены.`,
      )
    )
      return;
    start(async () => {
      const res = await deleteAccount(a.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Счёт удалён");
      router.refresh();
    });
  }

  function archiveAccount(a: AccountWithBalance) {
    start(async () => {
      const res = await setAccountArchived(a.id, !a.archived);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function removeTx(t: TransactionRow) {
    if (!window.confirm("Удалить транзакцию?")) return;
    start(async () => {
      const res = await deleteTransaction(t.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Транзакция удалена");
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Finances"
        description="Счета, баланс и история доходов и расходов."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingAccount(null);
                setAccountDialog(true);
              }}
            >
              <Plus className="size-4" />
              Счёт
            </Button>
            <Button
              onClick={() => {
                setEditingTx(null);
                setTxDialog(true);
              }}
              disabled={activeAccounts.length === 0}
            >
              <Plus className="size-4" />
              Транзакция
            </Button>
          </div>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Пока нет счетов"
          description="Создайте счёт, чтобы вести доходы и расходы."
        />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-4",
                  a.archived && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {ACCOUNT_TYPE_LABELS[a.type]}
                    </p>
                    <h3 className="font-medium">{a.name}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="rounded-md p-1 text-muted-foreground outline-none hover:bg-accent"
                      aria-label="Действия"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditingAccount(a);
                          setAccountDialog(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Pencil className="size-4" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => archiveAccount(a)}
                        className="cursor-pointer"
                      >
                        {a.archived ? (
                          <>
                            <ArchiveRestore className="size-4" />
                            Из архива
                          </>
                        ) : (
                          <>
                            <Archive className="size-4" />
                            В архив
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => removeAccount(a)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-4 text-2xl font-semibold tabular-nums">
                  {formatMoney(a.balance, a.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Транзакции</h2>
            <div className="flex gap-2">
              <Select value={accFilter} onValueChange={setAccFilter}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Все счета</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Все типы</SelectItem>
                  <SelectItem value="INCOME">Доходы</SelectItem>
                  <SelectItem value="EXPENSE">Расходы</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Нет транзакций"
              description="Добавьте первую транзакцию или измените фильтры."
            />
          ) : (
            <TransactionList
              transactions={filteredTx}
              onEdit={(t) => {
                setEditingTx(t);
                setTxDialog(true);
              }}
              onDelete={removeTx}
            />
          )}
        </>
      )}

      <AccountDialog
        open={accountDialog}
        onOpenChange={setAccountDialog}
        account={editingAccount}
      />
      <TransactionDialog
        open={txDialog}
        onOpenChange={setTxDialog}
        transaction={editingTx}
        accounts={activeAccounts}
        categories={categories}
      />
    </>
  );
}
