import Link from "next/link";
import type { Metadata } from "next";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarClock,
  CalendarDays,
  CheckSquare,
  CreditCard,
  Flame,
  HandCoins,
  Pin,
  Target,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DashboardTasks } from "@/features/dashboard/components/dashboard-tasks";
import { DEFAULT_HABIT_COLOR } from "@/features/habits/constants";
import { formatMoney } from "@/features/finances/money";
import { MOOD_EMOJI, MOOD_LABEL } from "@/features/journal/constants";
import { getDashboardSummary } from "@/features/dashboard/queries";
import type { AgendaKind } from "@/features/agenda/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Главная" };

type Accent = "violet" | "amber" | "emerald" | "rose" | "fuchsia" | "sky";

const ACCENT: Record<
  Accent,
  { chip: string; bar: string; ring: string; barBg: string }
> = {
  violet: {
    chip: "bg-violet-500/15 text-violet-400",
    bar: "border-l-violet-500",
    ring: "hover:border-violet-500/50",
    barBg: "bg-violet-500",
  },
  amber: {
    chip: "bg-amber-500/15 text-amber-400",
    bar: "border-l-amber-500",
    ring: "hover:border-amber-500/50",
    barBg: "bg-amber-500",
  },
  emerald: {
    chip: "bg-emerald-500/15 text-emerald-400",
    bar: "border-l-emerald-500",
    ring: "hover:border-emerald-500/50",
    barBg: "bg-emerald-500",
  },
  rose: {
    chip: "bg-rose-500/15 text-rose-400",
    bar: "border-l-rose-500",
    ring: "hover:border-rose-500/50",
    barBg: "bg-rose-500",
  },
  fuchsia: {
    chip: "bg-fuchsia-500/15 text-fuchsia-400",
    bar: "border-l-fuchsia-500",
    ring: "hover:border-fuchsia-500/50",
    barBg: "bg-fuchsia-500",
  },
  sky: {
    chip: "bg-sky-500/15 text-sky-400",
    bar: "border-l-sky-500",
    ring: "hover:border-sky-500/50",
    barBg: "bg-sky-500",
  },
};

const AGENDA_ACCENT: Record<AgendaKind, Accent> = {
  task: "violet",
  goal: "fuchsia",
  debt: "rose",
  subscription: "sky",
};

const AGENDA_ICON: Record<AgendaKind, LucideIcon> = {
  task: CheckSquare,
  goal: Target,
  debt: HandCoins,
  subscription: CreditCard,
};

function greeting(hour: number): string {
  if (hour < 6) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export default async function DashboardPage() {
  const s = await getDashboardSummary();
  const now = new Date();
  const currencies = Object.entries(s.balances);
  const debtCurrencies = Object.entries(s.debts.totals);

  return (
    <>
      {/* Greeting hero */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting(now.getHours())} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">
            {format(now, "EEEE, d MMMM", { locale: ru })}
          </p>
        </div>
        {s.todayMood != null && (
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-amber-500/50"
            title={MOOD_LABEL[s.todayMood]}
          >
            <span className="text-base">{MOOD_EMOJI[s.todayMood]}</span>
            <span className="text-muted-foreground">настроение сегодня</span>
          </Link>
        )}
      </div>

      {/* Key numbers — Долги replaced with Расходы (месяц) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          href="/tasks"
          accent="violet"
          icon={CheckSquare}
          label="Задачи сегодня"
          value={String(s.tasks.due.length)}
          hint={`${s.tasks.openCount} открытых всего`}
        />
        <StatCard
          href="/habits"
          accent="amber"
          icon={Flame}
          label="Привычки"
          value={s.habits.total ? `${s.habits.doneToday}/${s.habits.total}` : "—"}
          hint="отмечено за сегодня"
        />
        <StatCard
          href="/finances"
          accent="emerald"
          icon={Wallet}
          label="Баланс"
          value={
            currencies.length
              ? formatMoney(currencies[0][1], currencies[0][0])
              : "—"
          }
          hint={
            currencies.length > 1
              ? currencies.slice(1).map(([c, v]) => formatMoney(v, c)).join(" · ")
              : "по всем счетам"
          }
        />
        <StatCard
          href="/finances"
          accent="rose"
          icon={TrendingDown}
          label="Расходы (месяц)"
          value={
            s.financeThisMonth.expense > 0
              ? formatMoney(s.financeThisMonth.expense, "KZT")
              : "—"
          }
          hint={
            s.financeThisMonth.income > 0
              ? `доходы ${formatMoney(s.financeThisMonth.income, "KZT")}`
              : "нет данных"
          }
        />
        <StatCard
          href="/goals"
          accent="fuchsia"
          icon={Target}
          label="Цели"
          value={String(s.goals.length)}
          hint="в работе"
        />
        <StatCard
          href="/subscriptions"
          accent="sky"
          icon={CreditCard}
          label="Платежи 7 дней"
          value={String(s.subscriptions.length)}
          hint="ближайшие списания"
        />
      </div>

      {/* Agenda + Tasks */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Panel
          title="Повестка"
          href="/agenda"
          icon={CalendarDays}
          accent="sky"
          className="lg:col-span-2"
        >
          {s.agenda.length === 0 ? (
            <Empty text="На ближайшие 30 дней ничего не запланировано." />
          ) : (
            <ul className="divide-y divide-border">
              {s.agenda.map((item) => {
                const Icon = AGENDA_ICON[item.kind];
                const acc = ACCENT[AGENDA_ACCENT[item.kind]];
                const overdue = differenceInCalendarDays(item.date, now) < 0;
                return (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        acc.chip,
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="flex-1 truncate text-sm">{item.title}</span>
                    {item.meta && (
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {item.meta}
                      </span>
                    )}
                    <span
                      className={cn(
                        "w-24 text-right text-xs tabular-nums",
                        overdue ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {relativeDay(item.date, now)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Задачи на сегодня" href="/tasks" icon={CheckSquare} accent="violet">
          <DashboardTasks tasks={s.tasks.due} />
        </Panel>
      </div>

      {/* Habits + Goals */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Привычки" href="/habits" icon={Flame} accent="amber">
          {s.habits.list.length === 0 ? (
            <Empty text="Привычек пока нет. Заведите первую." />
          ) : (
            <ul className="space-y-3 pt-1">
              {s.habits.list.map((h) => {
                const color = h.color ?? DEFAULT_HABIT_COLOR;
                const pct = Math.round((h.weekDone / 7) * 100);
                return (
                  <li key={h.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        {h.icon && <span className="shrink-0">{h.icon}</span>}
                        <span className="truncate">{h.name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {h.weekDone}/7
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Цели" href="/goals" icon={Target} accent="fuchsia">
          {s.goals.length === 0 ? (
            <Empty text="Активных целей нет. Поставьте первую." />
          ) : (
            <ul className="space-y-3 pt-1">
              {s.goals.slice(0, 4).map((g) => (
                <li key={g.id}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{g.title}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {g.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-fuchsia-500"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Subscriptions + Finance */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel
          title="Ближайшие платежи"
          href="/subscriptions"
          icon={CreditCard}
          accent="sky"
        >
          {s.subscriptions.length === 0 ? (
            <Empty text="Нет платежей в ближайшие 7 дней." />
          ) : (
            <ul className="divide-y divide-border">
              {s.subscriptions.map((sub) => {
                const days = differenceInCalendarDays(sub.nextPaymentDate, now);
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

        <Panel title="Финансы (этот месяц)" href="/finances" icon={Wallet} accent="emerald">
          {s.financeThisMonth.income === 0 && s.financeThisMonth.expense === 0 ? (
            <Empty text="Нет транзакций за этот месяц." />
          ) : (
            <div className="space-y-3 pt-1">
              <FinanceRow
                label="Доходы"
                value={s.financeThisMonth.income}
                total={Math.max(s.financeThisMonth.income, s.financeThisMonth.expense)}
                color="bg-emerald-500"
              />
              <FinanceRow
                label="Расходы"
                value={s.financeThisMonth.expense}
                total={Math.max(s.financeThisMonth.income, s.financeThisMonth.expense)}
                color="bg-destructive"
              />
              <div className="border-t border-border pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Сальдо</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      s.financeThisMonth.income - s.financeThisMonth.expense >= 0
                        ? "text-emerald-500"
                        : "text-destructive",
                    )}
                  >
                    {formatMoney(
                      s.financeThisMonth.income - s.financeThisMonth.expense,
                      "KZT",
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Debts */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Долги" href="/debts" icon={HandCoins} accent="rose">
          {debtCurrencies.length === 0 ? (
            <Empty text="Нет открытых долгов." />
          ) : (
            <div className="space-y-3 pt-1">
              {debtCurrencies.map(([currency, totals]) => (
                <div key={currency} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Мне должны</span>
                    <span className="tabular-nums text-emerald-500">
                      {formatMoney(totals.owedToMe, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Я должен</span>
                    <span className="tabular-nums text-destructive">
                      {formatMoney(totals.iOwe, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-1.5 text-sm font-medium">
                    <span>Чистый баланс</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        totals.net >= 0 ? "text-emerald-500" : "text-destructive",
                      )}
                    >
                      {formatMoney(totals.net, currency)}
                    </span>
                  </div>
                </div>
              ))}
              {s.debts.overdue > 0 && (
                <p className="text-xs font-medium text-destructive">
                  {s.debts.overdue} просрочено
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>

      {s.pinnedNotes > 0 && (
        <Link
          href="/notes"
          className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Pin className="size-4" />
          Закреплённых заметок: {s.pinnedNotes}
        </Link>
      )}
    </>
  );
}

function FinanceRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{formatMoney(value, "KZT")}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({
  href, accent, icon: Icon, label, value, hint, alert,
}: {
  href: string;
  accent: Accent;
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  alert?: boolean;
}) {
  const a = ACCENT[accent];
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl border border-border border-l-2 bg-card p-4 transition-colors",
        a.bar, a.ring,
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", a.chip)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 truncate text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-xs", alert ? "font-medium text-destructive" : "text-muted-foreground/70")}>
        {hint}
      </p>
    </Link>
  );
}

function Panel({
  title, href, icon: Icon, accent, className, children,
}: {
  title: string;
  href: string;
  icon: LucideIcon;
  accent: Accent;
  className?: string;
  children: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-medium">
          <span className={cn("flex size-6 items-center justify-center rounded-md", a.chip)}>
            <Icon className="size-3.5" />
          </span>
          {title}
        </h2>
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

function relativeDay(date: Date, now: Date): string {
  if (isToday(date)) return "сегодня";
  if (isTomorrow(date)) return "завтра";
  const diff = differenceInCalendarDays(date, now);
  if (diff < 0) return format(date, "d MMM", { locale: ru });
  return `${diff} дн.`;
}
