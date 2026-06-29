import Link from "next/link";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarDays,
  CheckSquare,
  CreditCard,
  HandCoins,
  Target,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { AgendaItem, AgendaKind } from "../queries";

const KIND_ICON: Record<AgendaKind, LucideIcon> = {
  task: CheckSquare,
  subscription: CreditCard,
  debt: HandCoins,
  goal: Target,
};

function dayLabel(date: Date): string {
  if (isToday(date)) return "Сегодня";
  if (isTomorrow(date)) return "Завтра";
  return format(date, "EEEE, d MMMM", { locale: ru });
}

export function AgendaView({ items }: { items: AgendaItem[] }) {
  // Group items by calendar day, preserving chronological order.
  const groups = new Map<string, { date: Date; items: AgendaItem[] }>();
  for (const item of items) {
    const key = format(item.date, "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, { date: item.date, items: [] });
    groups.get(key)!.items.push(item);
  }

  const now = new Date();

  return (
    <>
      <PageHeader
        title="Повестка"
        description="Ближайшие 30 дней: задачи, платежи, сроки долгов и целей."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="На ближайшее время пусто"
          description="Сроки задач, платежи подписок и долгов появятся здесь автоматически."
        />
      ) : (
        <div className="space-y-6">
          {Array.from(groups.values()).map(({ date, items }) => {
            const overdue = differenceInCalendarDays(date, now) < 0;
            return (
              <section key={format(date, "yyyy-MM-dd")}>
                <h2
                  className={cn(
                    "mb-2 text-sm font-medium capitalize",
                    overdue ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {overdue ? "Просрочено · " : ""}
                  {dayLabel(date)}
                </h2>
                <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                  {items.map((item) => {
                    const Icon = KIND_ICON[item.kind];
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50"
                        >
                          <Icon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate text-sm">
                            {item.title}
                          </span>
                          {item.meta && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {item.meta}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
