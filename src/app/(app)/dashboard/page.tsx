import Link from "next/link";
import type { Metadata } from "next";
import { differenceInCalendarDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarClock,
  CheckSquare,
  CreditCard,
  Flame,
  Pin,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityDot } from "@/features/tasks/components/priority-badge";
import { formatMoney } from "@/features/finances/money";
import { getDashboardSummary } from "@/features/dashboard/queries";

export const metadata: Metadata = { title: "Главная" };

export default async function DashboardPage() {
  const s = await getDashboardSummary();
  const currencies = Object.entries(s.balances);

  return (
    <>
      <PageHeader
        title="Главная"
        description="Вся жизнь на одном экране."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          href="/tasks"
          icon={<CheckSquare className="size-5" />}
          label="Задачи на сегодня"
          value={String(s.tasks.due.length)}
          hint={`${s.tasks.openCount} открытых всего`}
        />
        <StatCard
          href="/habits"
          icon={<Flame className="size-5" />}
          label="Привычки сегодня"
          value={s.habits.total ? `${s.habits.doneToday}/${s.habits.total}` : "—"}
          hint="отмечено за сегодня"
        />
        <StatCard
          href="/finances"
          icon={<Wallet className="size-5" />}
          label="Баланс"
          value={
            currencies.length
              ? formatMoney(currencies[0][1], currencies[0][0])
              : "—"
          }
          hint={
            currencies.length > 1
              ? currencies
                  .slice(1)
                  .map(([c, v]) => formatMoney(v, c))
                  .join(" · ")
              : "по всем счетам"
          }
        />
        <StatCard
          href="/subscriptions"
          icon={<CreditCard className="size-5" />}
          label="Платежи (7 дней)"
          value={String(s.subscriptions.length)}
          hint="ближайшие списания"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Задачи на сегодня" href="/tasks">
          {s.tasks.due.length === 0 ? (
            <Empty text="На сегодня ничего не запланировано." />
          ) : (
            <ul className="divide-y divide-border">
              {s.tasks.due.map((t) => {
                const overdue =
                  differenceInCalendarDays(t.dueDate, new Date()) < 0;
                return (
                  <li key={t.id} className="flex items-center gap-2 py-2.5">
                    <PriorityDot priority={t.priority} />
                    <span className="flex-1 truncate text-sm">{t.title}</span>
                    {t.project && (
                      <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: t.project.color ?? "#8b5cf6" }}
                        />
                        {t.project.name}
                      </span>
                    )}
                    <span
                      className={cnDate(overdue)}
                    >
                      {format(t.dueDate, "d MMM", { locale: ru })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Ближайшие платежи" href="/subscriptions">
          {s.subscriptions.length === 0 ? (
            <Empty text="Нет платежей в ближайшие 7 дней." />
          ) : (
            <ul className="divide-y divide-border">
              {s.subscriptions.map((sub) => {
                const days = differenceInCalendarDays(
                  sub.nextPaymentDate,
                  new Date(),
                );
                return (
                  <li key={sub.id} className="flex items-center gap-2 py-2.5">
                    <span className="text-lg">{sub.icon || "💳"}</span>
                    <span className="flex-1 truncate text-sm">{sub.name}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatMoney(sub.amount, sub.currency)}
                    </span>
                    <span className="inline-flex w-20 items-center justify-end gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="size-3" />
                      {days <= 0 ? "сегодня" : `${days} дн.`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {s.pinnedNotes > 0 && (
        <Link
          href="/notes"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Pin className="size-4" />
          Закреплённых заметок: {s.pinnedNotes}
        </Link>
      )}
    </>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-muted-foreground transition-colors group-hover:text-primary">
          {icon}
        </span>
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <Link href={href} className="text-xs text-primary hover:underline">
          Открыть
        </Link>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function cnDate(overdue: boolean): string {
  return overdue
    ? "text-xs text-destructive"
    : "text-xs text-muted-foreground";
}
