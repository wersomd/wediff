"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import {
  CalendarClock,
  Check,
  CreditCard,
  ExternalLink,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
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
import { SubscriptionDialog } from "./subscription-dialog";
import {
  deleteSubscription,
  markSubscriptionPaid,
  setSubscriptionActive,
} from "../actions";
import { advanceByCycle, monthlyEquivalent } from "../billing";
import { BILLING_CYCLE_SHORT } from "../constants";
import type { SubscriptionRow } from "../queries";

export function SubscriptionsView({
  subscriptions,
  categories,
}: {
  subscriptions: SubscriptionRow[];
  categories: string[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionRow | null>(null);

  // Monthly-equivalent totals per currency (active subs only).
  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of subscriptions) {
      if (!s.active) continue;
      map[s.currency] =
        (map[s.currency] ?? 0) + monthlyEquivalent(s.amount, s.billingCycle);
    }
    return map;
  }, [subscriptions]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function paid(s: SubscriptionRow) {
    start(async () => {
      const res = await markSubscriptionPaid(s.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Отмечено. Следующий платёж — ${format(
          advanceByCycle(s.nextPaymentDate, s.billingCycle),
          "d MMM",
          { locale: ru },
        )}`,
      );
      router.refresh();
    });
  }

  function toggleActive(s: SubscriptionRow) {
    start(async () => {
      const res = await setSubscriptionActive(s.id, !s.active);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(s: SubscriptionRow) {
    if (!window.confirm(`Удалить подписку «${s.name}»?`)) return;
    start(async () => {
      const res = await deleteSubscription(s.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Подписка удалена");
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Регулярные платежи с напоминанием о следующем списании."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Новая подписка
          </Button>
        }
      />

      {Object.keys(totals).length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          {Object.entries(totals).map(([currency, total]) => (
            <div
              key={currency}
              className="rounded-xl border border-border bg-card px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">В месяц ({currency})</p>
              <p className="text-xl font-semibold tabular-nums">
                {formatMoney(total, currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Пока нет подписок"
          description="Добавьте регулярный платёж — Netflix, Spotify, домен и т.п."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((s) => {
            const days = differenceInCalendarDays(s.nextPaymentDate, new Date());
            const overdue = days < 0;
            const dueSoon = !overdue && days <= s.reminderDaysBefore;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex flex-col rounded-xl border border-border bg-card p-4",
                  !s.active && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-lg">
                      {s.icon || "💳"}
                    </span>
                    <div>
                      <h3 className="font-medium leading-tight">{s.name}</h3>
                      {s.category && (
                        <span className="text-xs text-muted-foreground">
                          {s.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="rounded-md p-1 text-muted-foreground outline-none hover:bg-accent"
                      aria-label="Действия"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => paid(s)} className="cursor-pointer">
                        <Check className="size-4" />
                        Оплачено
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(s);
                          setDialogOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Pencil className="size-4" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toggleActive(s)} className="cursor-pointer">
                        {s.active ? (
                          <>
                            <Pause className="size-4" />
                            Приостановить
                          </>
                        ) : (
                          <>
                            <Play className="size-4" />
                            Возобновить
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => remove(s)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="mt-3 text-xl font-semibold tabular-nums">
                  {formatMoney(s.amount, s.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    {BILLING_CYCLE_SHORT[s.billingCycle]}
                  </span>
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {format(s.nextPaymentDate, "d MMM", { locale: ru })}
                  </span>
                  {!s.active ? (
                    <Badge variant="outline" className="text-xs">
                      На паузе
                    </Badge>
                  ) : overdue ? (
                    <Badge variant="destructive" className="text-xs">
                      Просрочено
                    </Badge>
                  ) : dueSoon ? (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs">
                      Через {days} дн.
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      через {days} дн.
                    </span>
                  )}
                </div>

                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    Управлять
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={editing}
        categories={categories}
      />
    </>
  );
}
