"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { allNavItems, railNav, footerNav } from "@/config/nav";
import { filterNavItems } from "./command-palette-filter";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const items = useMemo(() => [...railNav.map((item) => ({ ...item, title: item.href === "/dashboard" ? "Сегодня" : item.title, groupTitle: "Пространство" })), ...allNavItems(), ...footerNav.map((item) => ({ ...item, groupTitle: "Пространство" }))], []);
  const results = useMemo(() => filterNavItems(items, query), [items, query]);

  function go(href: string) {
    router.push(href);
    onOpenChange(false);
    setQuery("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="top-[20%] max-w-md translate-y-0 gap-0 rounded-2xl p-0 shadow-lg"
        onInteractOutside={() => {
          // Unlike the app's form dialogs, a stray click outside a "jump to"
          // palette is exactly how you're meant to dismiss it.
        }}
      >
        <DialogTitle className="sr-only">Перейти в раздел</DialogTitle>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) go(results[0].href);
          }}
          placeholder="Куда перейти?"
          className="h-12 rounded-b-none rounded-t-2xl border-x-0 border-t-0 focus-visible:ring-0"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </li>
          )}
          {results.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => go(item.href)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="flex-1">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.groupTitle}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
