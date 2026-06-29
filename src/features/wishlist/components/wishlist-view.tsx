"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { WishStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
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
import { WishDialog } from "./wish-dialog";
import { deleteWish, setWishStatus } from "../actions";
import {
  WISH_STATUS_LABELS,
  WISH_STATUS_ORDER,
  WISH_TYPE_ICONS,
  WISH_TYPE_LABELS,
} from "../constants";
import type { WishRow } from "../queries";

export function WishlistView({ items }: { items: WishRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WishRow | null>(null);

  function act(fn: () => Promise<{ ok: true } | { error: string }>, ok?: string) {
    start(async () => {
      const res = await fn();
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      if (ok) toast.success(ok);
      router.refresh();
    });
  }

  function remove(w: WishRow) {
    if (!window.confirm(`Удалить «${w.title}»?`)) return;
    act(() => deleteWish(w.id), "Удалено");
  }

  return (
    <>
      <PageHeader
        title="Хочу"
        description="Книги, фильмы, покупки и места — что хочется и что уже сделано."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Добавить
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Список пуст"
          description="Добавьте первое желание — книгу, фильм или покупку."
        />
      ) : (
        <div className="space-y-6">
          {WISH_STATUS_ORDER.map((status) => {
            const group = items.filter((w) => w.status === status);
            if (group.length === 0) return null;
            return (
              <section key={status}>
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                  {WISH_STATUS_LABELS[status]}{" "}
                  <span className="tabular-nums">({group.length})</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((w) => (
                    <WishCard
                      key={w.id}
                      item={w}
                      onEdit={() => {
                        setEditing(w);
                        setDialogOpen(true);
                      }}
                      onDelete={() => remove(w)}
                      act={act}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <WishDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} />
    </>
  );
}

function WishCard({
  item,
  onEdit,
  onDelete,
  act,
}: {
  item: WishRow;
  onEdit: () => void;
  onDelete: () => void;
  act: (
    fn: () => Promise<{ ok: true } | { error: string }>,
    ok?: string,
  ) => void;
}) {
  const done = item.status === WishStatus.DONE;
  const next =
    item.status === WishStatus.WANT
      ? WishStatus.IN_PROGRESS
      : item.status === WishStatus.IN_PROGRESS
        ? WishStatus.DONE
        : null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-3",
        done && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="text-lg">{WISH_TYPE_ICONS[item.type]}</span>
          <div className="min-w-0">
            <h3 className={cn("font-medium leading-tight", done && "line-through")}>
              {item.title}
            </h3>
            <span className="text-xs text-muted-foreground">
              {WISH_TYPE_LABELS[item.type]}
            </span>
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
            {next && (
              <DropdownMenuItem
                onSelect={() => act(() => setWishStatus(item.id, next))}
                className="cursor-pointer"
              >
                {next === WishStatus.DONE ? (
                  <Check className="size-4" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {WISH_STATUS_LABELS[next]}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onEdit} className="cursor-pointer">
              <Pencil className="size-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onDelete}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {item.note && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {item.note}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {item.price != null && (
          <span className="tabular-nums">
            {formatMoney(item.price, item.currency ?? "KZT")}
          </span>
        )}
        {done && item.rating != null && (
          <span className="inline-flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: item.rating }).map((_, i) => (
              <Star key={i} className="size-3 fill-current" />
            ))}
          </span>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            Ссылка
          </a>
        )}
      </div>
    </div>
  );
}
