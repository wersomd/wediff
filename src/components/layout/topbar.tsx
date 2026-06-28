"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar";
import { AccountMenu } from "./account-menu";
import { siteConfig } from "@/config/site";

export function Topbar({
  user,
}: {
  user: { email?: string | null; name?: string | null };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-1 flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Открыть меню"
        >
          <Menu className="size-5" />
        </button>
        <span className="font-semibold md:hidden">{siteConfig.name}</span>

        <div className="ml-auto flex items-center gap-2">
          {/* Theme toggle lands in Phase 7 */}
          <AccountMenu user={user} />
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-border bg-card">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Закрыть меню"
            >
              <X className="size-5" />
            </button>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
