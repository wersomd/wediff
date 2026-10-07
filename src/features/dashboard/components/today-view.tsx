"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, CheckCheck, Circle, Clock3, CreditCard, ListTodo, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { TaskStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { TaskRow } from "@/features/tasks/components/task-row";
import { toggleDone } from "@/features/tasks/actions";
import { ALL, OPEN_TASK_STATUSES } from "@/features/tasks/constants";
import { applyTaskView } from "@/features/tasks/view";
import type { TaskWithProject } from "@/features/tasks/queries";
import { formatMoney } from "@/features/finances/money";
import { dateLabel, dayKey, daysFromToday, eventTime, WORKSPACE_TIME_ZONE } from "@/lib/workspace-date";
import type { TodayWorkspace } from "../workspace-queries";
import { cn } from "@/lib/utils";

const tabs = [{ id: "TODAY", label: "Сегодня" }, { id: "OVERDUE", label: "Просрочено" }, { id: "WEEK", label: "На неделе" }] as const;
type Period = typeof tabs[number]["id"];

export function TodayView({ data }: { data: TodayWorkspace }) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("TODAY");
  const [tasks, setTasks] = useState(data.tasks);
  const [editing, setEditing] = useState<TaskWithProject | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => setTasks(data.tasks), [data.tasks]);
  const select = (due: Period) => applyTaskView(tasks, { status: "OPEN", due, priority: ALL, projectId: ALL, created: ALL }, "priority", data.now);
  const visible = select(period);
  const openCount = tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status)).length;
  const completedToday = tasks.filter((t) => t.status === "DONE" && t.completedAt && dayKey(t.completedAt) === dayKey(data.now)).length;
  const dateText = new Intl.DateTimeFormat("ru", { weekday: "long", day: "numeric", month: "long", timeZone: WORKSPACE_TIME_ZONE }).format(data.now);

  function complete(id: string, done: boolean) {
    if (pending) return;
    const previous = tasks;
    setTasks((items) => items.map((t) => t.id === id ? { ...t, status: done ? TaskStatus.DONE : TaskStatus.TODO, completedAt: done ? data.now : null } : t));
    start(async () => {
      try {
        const result = await toggleDone(id, done);
        if ("error" in result) throw new Error(result.error);
        router.refresh();
      } catch {
        setTasks(previous);
        toast.error("Не удалось сохранить задачу. Попробуйте ещё раз.");
      }
    });
  }

  return <>
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 text-sm capitalize text-muted-foreground">{dateText}</p><h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Твой день. Твой ход.</h1><p className="mt-3 text-sm text-muted-foreground">Задачи, планы и деньги — всё под контролем.</p></div>
      <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" />Новая задача</Button>
    </div>

    <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        { label: "Открытых задач", count: openCount, icon: ListTodo, href: "/tasks?status=OPEN", color: "text-primary bg-primary/10" },
        { label: "Нужно сегодня", count: select("TODAY").length, icon: Circle, href: "/tasks?status=OPEN&due=TODAY", color: "text-primary bg-primary/10" },
        { label: "Просрочено", count: select("OVERDUE").length, icon: Clock3, href: "/tasks?status=OPEN&due=OVERDUE", color: "text-destructive bg-destructive/10" },
        { label: "Готово сегодня", count: completedToday, icon: CheckCheck, href: "/tasks?status=DONE", color: "text-success bg-success/10" },
      ].map((stat) => <Link key={stat.label} href={stat.href} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 md:p-5">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", stat.color)}><stat.icon className="size-5" /></span>
        <div><p className="text-2xl font-semibold tabular-nums">{stat.count}</p><p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p></div><ArrowUpRight className="ml-auto hidden size-4 text-muted-foreground group-hover:text-primary sm:block" />
      </Link>)}
    </div>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="workspace-panel min-w-0" aria-label="Задачи">
        <div className="workspace-panel-heading"><div className="flex items-center gap-2"><ListTodo className="size-5 text-primary" /><h2 className="text-lg font-semibold">В фокусе</h2></div><Link href="/tasks" className="text-xs font-semibold text-primary hover:underline">Все задачи</Link></div>
        <div className="flex overflow-x-auto border-b border-border p-3"><div role="group" aria-label="Период задач" className="flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => <button key={tab.id} aria-pressed={period === tab.id} onClick={() => setPeriod(tab.id)} className="workspace-tab">{tab.label}<span className="rounded bg-primary/10 px-1.5 text-[11px] tabular-nums">{select(tab.id).length}</span></button>)}
        </div></div>
        <div aria-label={tabs.find((t) => t.id === period)?.label} aria-busy={pending}>
          {visible.length ? visible.map((task) => <TaskRow key={task.id} task={task} disabled={pending} onToggle={(done) => complete(task.id, done)} onClick={() => { setEditing(task); setOpen(true); }} />) : <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Check className="size-7" /></span>
            <h3 className="text-base font-semibold">{period === "OVERDUE" ? "Никаких просрочек" : "Есть место для новых планов"}</h3>
            <p className="mb-5 mt-2 max-w-xs text-sm text-muted-foreground">{period === "OVERDUE" ? "Все сроки под контролем. Можно двигаться дальше." : "Добавь задачу со сроком — она появится здесь."}</p>
            <Button variant="outline" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" />Добавить задачу</Button>
          </div>}
        </div>
        <Link href="/tasks?view=board" className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-4 text-sm font-medium hover:text-primary">Открыть доску задач<ArrowUpRight className="size-4" /></Link>
      </section>
      <div className="space-y-5">
        <section className="workspace-panel">
          <div className="workspace-panel-heading"><h2 className="flex items-center gap-2 font-semibold"><CreditCard className="size-4 text-primary" />Ближайшие платежи</h2><span className="rounded-md bg-muted px-2 py-1 text-xs">7 дней</span></div>
          {data.payments.length ? <div className="divide-y divide-border">{data.payments.slice(0, 5).map((p) => <Link key={p.id} href={p.href} className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-muted/50">
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.title}</p><p className="mt-1 text-xs text-muted-foreground">{p.label} · <span className={cn(daysFromToday(p.date, data.now) < 0 && "text-destructive")}>{dateLabel(p.date)}{daysFromToday(p.date, data.now) < 0 && " · просрочено"}</span></p></div><span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(p.amount, p.currency)}</span>
          </Link>)}</div> : <p className="px-5 py-6 text-sm text-muted-foreground">На ближайшую неделю платежей нет.</p>}
          <div className="flex justify-between border-t border-border px-5 py-3 text-xs font-semibold text-primary"><Link href="/subscriptions" className="hover:underline">Все подписки</Link><Link href="/debts" className="hover:underline">Все долги</Link></div>
        </section>
        <section className="workspace-panel">
          <div className="workspace-panel-heading"><h2 className="flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-primary" />Расписание</h2><Link href="/calendar?create=1" aria-label="Добавить событие" className="rounded p-1 hover:bg-muted"><Plus className="size-4" /></Link></div>
          {data.events.length ? data.events.slice(0, 5).map((event) => <Link key={event.id} href={`/calendar?day=${dayKey(event.startAt)}`} className="flex gap-3 px-5 py-3 hover:bg-muted/50"><span className="text-sm font-semibold text-primary">{eventTime(event.startAt)}</span><span className="min-w-0 truncate text-sm">{event.title}</span></Link>) : <p className="px-5 py-5 text-sm text-muted-foreground">Сегодня без встреч. Время для фокуса.</p>}
          <Link href="/calendar" className="flex items-center justify-between border-t border-border px-5 py-3 text-xs font-semibold text-primary">Весь календарь<ArrowUpRight className="size-3.5" /></Link>
        </section>
        <section className="rounded-xl bg-[#17233B] p-5 text-white">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-white/80"><Wallet className="size-4" />На счетах</h2>
          {Object.entries(data.balances).length ? Object.entries(data.balances).map(([currency, balance]) => <p key={currency} className="mb-2 text-2xl font-semibold tabular-nums">{formatMoney(balance, currency)}</p>) : <p className="text-sm text-white/80">Добавь первый счёт, чтобы видеть баланс.</p>}
          <Link href="/finances" className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-xs font-medium">Мои финансы<ArrowDownLeft className="size-4" /></Link>
        </section>
      </div>
    </div>
    <TaskDialog open={open} onOpenChange={setOpen} task={editing} projects={data.projects} />
  </>;
}
