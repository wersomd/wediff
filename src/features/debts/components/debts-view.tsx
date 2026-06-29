"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import {
  CalendarClock,
  HandCoins,
  MoreHorizontal,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/features/finances/money";
import type { AccountWithBalance } from "@/features/finances/queries";
import { DebtDialog } from "./debt-dialog";
import { PaymentDialog } from "./payment-dialog";
import { deleteDebt } from "../actions";
import { DEBT_DIRECTION_LABELS } from "../constants";
import { computeDebtTotals } from "../summary";
import type { CounterpartyView, DebtView } from "../queries";

export function DebtsView({
  counterparties,
  accounts,
  counterpartyNames,
}: {
  counterparties: CounterpartyView[];
  accounts: AccountWithBalance[];
  counterpartyNames: string[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [payDebt, setPayDebt] = useState<DebtView | null>(null);

  const allDebts = useMemo(
    () => counterparties.flatMap((c) => c.debts),
    [counterparties],
  );
  const totals = useMemo(() => computeDebtTotals(allDebts), [allDebts]);

  function remove(debt: DebtView, counterpartyName: string) {
    if (
      !window.confirm(
        `Удалить долг с «${counterpartyName}»? Связанные транзакции тоже откатятся.`,
      )
    )
      return;
    start(async () => {
      const res = await deleteDebt(debt.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Долг удалён");
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Долги"
        description="Кому я должен, кто должен мне, и общий баланс."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Новый долг
          </Button>
        }
      />

      {Object.keys(totals).length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(totals).map(([currency, t]) => (
            <div
              key={currency}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">
                Чистый баланс ({currency})
              </p>
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  t.net > 0 && "text-primary",
                  t.net < 0 && "text-destructive",
                )}
              >
                {formatMoney(t.net, currency)}
              </p>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>Я должен: {formatMoney(t.iOwe, currency)}</span>
                <span>Мне должны: {formatMoney(t.owedToMe, currency)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {counterparties.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="Долгов пока нет"
          description="Добавьте первый: кому вы должны или кто должен вам."
        />
      ) : (
        <div className="space-y-4">
          {counterparties.map((c) => (
            <CounterpartyCard
              key={c.id}
              counterparty={c}
              onPay={setPayDebt}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      <DebtDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        accounts={accounts}
        counterpartyNames={counterpartyNames}
      />
      <PaymentDialog
        debt={payDebt}
        accounts={accounts}
        onOpenChange={(open) => !open && setPayDebt(null)}
      />
    </>
  );
}

function CounterpartyCard({
  counterparty,
  onPay,
  onDelete,
}: {
  counterparty: CounterpartyView;
  onPay: (debt: DebtView) => void;
  onDelete: (debt: DebtView, counterpartyName: string) => void;
}) {
  const totals = computeDebtTotals(counterparty.debts);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-medium">{counterparty.name}</h3>
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 text-sm tabular-nums">
          {Object.entries(totals).map(([currency, t]) => (
            <span
              key={currency}
              className={cn(
                t.net > 0 && "text-primary",
                t.net < 0 && "text-destructive",
                t.net === 0 && "text-muted-foreground",
              )}
            >
              {formatMoney(t.net, currency)}
            </span>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-border">
        {counterparty.debts.map((d) => (
          <DebtRow
            key={d.id}
            debt={d}
            counterpartyName={counterparty.name}
            onPay={onPay}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}

function DebtRow({
  debt,
  counterpartyName,
  onPay,
  onDelete,
}: {
  debt: DebtView;
  counterpartyName: string;
  onPay: (debt: DebtView) => void;
  onDelete: (debt: DebtView, counterpartyName: string) => void;
}) {
  const settled = debt.status === "PAID";
  const days = debt.dueDate
    ? differenceInCalendarDays(debt.dueDate, new Date())
    : null;
  const overdue = !settled && days !== null && days < 0;
  const progress =
    debt.principal > 0
      ? Math.min(100, Math.round((debt.paid / debt.principal) * 100))
      : 0;

  return (
    <li className={cn("px-4 py-3", settled && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">
              {DEBT_DIRECTION_LABELS[debt.direction]}
            </Badge>
            {debt.description && (
              <span className="truncate text-sm text-muted-foreground">
                {debt.description}
              </span>
            )}
          </div>
          <p className="mt-1 text-base font-semibold tabular-nums">
            {formatMoney(debt.remaining, debt.currency)}
            {debt.paid > 0 && !settled && (
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                из {formatMoney(debt.principal, debt.currency)}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {settled ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs">
              Погашен
            </Badge>
          ) : overdue ? (
            <Badge variant="destructive" className="text-xs">
              Просрочен
            </Badge>
          ) : days !== null ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {format(debt.dueDate as Date, "d MMM", { locale: ru })}
            </span>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-md p-1 text-muted-foreground outline-none hover:bg-accent"
              aria-label="Действия"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => onPay(debt)}
                className="cursor-pointer"
              >
                <Wallet className="size-4" />
                {settled ? "История" : "Погашение"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDelete(debt, counterpartyName)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!settled && debt.paid > 0 && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </li>
  );
}
