"use client";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CalendarClock } from "lucide-react";
import { dateLabel, daysFromToday } from "@/lib/workspace-date";
import type { PaymentObligation } from "../types";
export function UpcomingPayments({ payments }: { payments: PaymentObligation[] }) {
 const groups = [
  { title: "Просрочено", test: (days: number) => days < 0, danger: true },
  { title: "Сегодня", test: (days: number) => days === 0, danger: false },
  { title: "Ближайшие 7 дней", test: (days: number) => days > 0 && days <= 7, danger: false },
 ];
 return <section className="mb-8 rounded-xl border border-border bg-card">
  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4"><div><h2 className="text-base font-semibold">Ближайшие оплаты</h2><p className="mt-1 text-xs text-muted-foreground">Долги и подписки · остаток к оплате</p></div><Link href="/settings" className="text-xs text-primary hover:underline">Напоминания в Telegram</Link></div>
  <div className="grid md:grid-cols-3">{groups.map(group => {
   const items = payments.filter(p => group.test(daysFromToday(p.dueDate)));
   return <div key={group.title} className="min-w-0 p-5"><h3 className={`mb-3 flex items-center justify-between text-sm font-medium ${group.danger && items.length ? "text-destructive" : "text-muted-foreground"}`}>{group.title}<span>{items.length}</span></h3>
    <div className="max-h-72 space-y-1 overflow-y-auto">{items.map(p => <Link key={`${p.kind}-${p.id}`} href={p.href} className="flex items-start gap-2 rounded-lg p-2 -mx-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
     {p.direction === "incoming" ? <ArrowDownLeft className="mt-1 size-4 shrink-0 text-success" /> : <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground" />}
     <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{p.title}</p><p className="mt-1 text-xs text-muted-foreground">{p.kind === "subscription" ? "Подписка" : p.direction === "incoming" ? "Мне должны" : "Я должен"} · {dateLabel(p.dueDate)}</p><p className="mt-1 text-sm tabular-nums">{Number(p.amount).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} {p.currency}</p></div>
    </Link>)}{!items.length && <p className="flex items-center gap-2 py-4 text-xs text-muted-foreground"><CalendarClock className="size-4" />Нет оплат</p>}</div>
   </div>;
  })}</div>
 </section>;
}
