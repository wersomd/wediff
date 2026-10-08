"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveReminderSettings } from "../actions";
import type { ReminderSettings as Settings } from "../schema";
import type { getReminderStatus } from "../settings";
const categories = [{ key: "tasks", label: "Задачи", hint: "Сегодня и просроченные" }, { key: "projects", label: "Проекты", hint: "За 3 дня до срока и после" }, { key: "debts", label: "Долги в обе стороны", hint: "За 3 дня до оплаты и после" }, { key: "subscriptions", label: "Подписки", hint: "По сроку напоминания подписки" }] as const;
export function ReminderSettings({ initial, status, invalid = false }: { initial: Settings; status: Awaited<ReturnType<typeof getReminderStatus>>; invalid?: boolean }) {
 const [settings, setSettings] = useState(initial);
 const [pending, start] = useTransition();
 const router = useRouter();
 const configured = status.telegram && status.scheduler && status.appUrl && status.journalAvailable;
 const date = (value: string) => new Intl.DateTimeFormat("ru", { timeZone: "Asia/Almaty", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
 function save() { start(async () => { try { const result = await saveReminderSettings(settings); if ("error" in result) toast.error(result.error); else { toast.success("Настройки напоминаний сохранены"); router.refresh(); } } catch { toast.error("Не удалось сохранить настройки"); } }); }
 return <section className="rounded-xl border border-border bg-card p-6">
  <div className="flex items-center gap-2"><Bell className="size-4 text-primary" /><h2 className="font-semibold">Напоминания в Telegram</h2></div>
  <p className="mt-2 text-sm text-muted-foreground">Ежедневно около 09:00 по Алматы. Одна сводка о задачах, проектах и оплатах. Если событий нет, сообщение не придёт.</p>
  <div className="my-5 rounded-lg bg-muted/60 p-3 text-sm">
   <p className="flex items-center gap-2">{configured ? <CheckCircle2 className="size-4 text-success" /> : <CircleAlert className="size-4 text-muted-foreground" />}{configured ? "Серверная конфигурация готова" : "Подключение не завершено"}</p>
   {!status.telegram && <p className="mt-1 text-xs text-muted-foreground">На сервере нужно подключить Telegram-бота и чат.</p>}
   {(!status.scheduler || !status.appUrl) && <p className="mt-1 text-xs text-muted-foreground">Не настроен доступ планировщика или адрес приложения.</p>}
   {!status.journalAvailable && <p className="mt-1 text-xs text-muted-foreground">Журнал доставок недоступен. Проверьте миграцию базы.</p>}
   <p className="mt-2 text-xs text-muted-foreground">{status.lastSentAt ? `Последняя доставка: ${date(status.lastSentAt)}` : "Подтверждённых доставок ещё нет. Расписание запускается после развёртывания."}</p>
   {status.problem && <p role="status" className="mt-2 text-xs text-destructive">{date(status.problem.date)}: {status.problem.status === "unknown" ? "Доставка не подтверждена. Проверьте чат; автоматический повтор остановлен." : "Есть недоставленные сообщения. Проверьте подключение бота."}</p>}
   {status.waiting > 0 && <p className="mt-1 text-xs text-muted-foreground">В очереди частей сводки: {status.waiting}</p>}
  </div>
  {invalid && <p className="mb-3 text-sm text-destructive">Сохранённые настройки повреждены. Сохраните выбранные параметры заново.</p>}
  <label className="flex items-center justify-between gap-3 border-b border-border pb-4 text-sm font-medium">Включить напоминания<input type="checkbox" className="size-4 accent-[var(--primary)]" checked={settings.enabled} disabled={pending} onChange={e => setSettings({ ...settings, enabled: e.target.checked })} /></label>
  <fieldset disabled={pending || !settings.enabled} className="my-4 space-y-4 disabled:opacity-50"><legend className="sr-only">Что включить в сводку</legend>{categories.map(c => <label key={c.key} className="flex items-center justify-between gap-3"><span><span className="block text-sm">{c.label}</span><span className="block text-xs text-muted-foreground">{c.hint}</span></span><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={settings[c.key]} onChange={e => setSettings({ ...settings, [c.key]: e.target.checked })} /></label>)}</fieldset>
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="max-w-xs text-xs text-muted-foreground">Изменения применятся к следующей сводке. Старые сообщения в очереди будут отменены.</p><Button disabled={pending || !status.journalAvailable} onClick={save}>{pending ? "Сохранение…" : "Сохранить"}</Button></div>
 </section>;
}
