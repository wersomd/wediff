"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CalendarDays, CheckSquare, ChevronDown, Files, Menu, Plus, Search, Sparkles, Wallet } from "lucide-react";
import { navGroups, railNav, footerNav, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandPalette } from "./command-palette";
import { AccountMenu } from "./account-menu";
import { ThemeToggle } from "./theme-toggle";

const fileItem: NavItem = { title: "Файлы", href: "/files", icon: Files };
const destinations = [...railNav, ...navGroups.flatMap((g) => g.items), fileItem, ...footerNav];

export function WorkspaceShell({ children, user }: {
  children: ReactNode;
  user: { email?: string | null; name?: string | null };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const current = destinations.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  function navLink(item: NavItem) {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined}
      className={cn("workspace-nav-link", active && "is-active")}>
      <item.icon className="size-[18px] shrink-0" />
      <span>{item.href === "/dashboard" ? "Сегодня" : item.title}</span>
      {active && <span className="ml-auto size-1.5 rounded-full bg-current" />}
    </Link>;
  }

  function navigation() {
    return <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-5 pb-7 pt-7" aria-label="WH OS — Сегодня">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white font-display text-lg font-bold text-[#174BEB]">w.</span>
        <span><span className="block font-display text-lg font-semibold tracking-tight">WH·OS</span><span className="text-[10px] text-white/75">Личное пространство</span></span>
      </Link>
      <nav aria-label="Главная навигация" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        <div className="space-y-1">{railNav.map(navLink)}</div>
        {navGroups.map((group) => <div key={group.id}>
          <p className="mb-2 px-3 text-xs font-medium text-white/70">{group.title}</p>
          <div className="space-y-1">{group.items.map(navLink)}</div>
        </div>)}
        <div className="space-y-1">{navLink(fileItem)}</div>
      </nav>
      <div className="border-t border-white/15 p-3">
        {footerNav.map(navLink)}
        <div className="mt-3 flex items-center gap-2 px-3 pb-2 text-xs text-white/75"><Sparkles className="size-3.5" /> Всё важное. В одном месте.</div>
      </div>
    </div>;
  }

  return <div className="workspace min-h-dvh">
    <a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-card focus:p-3">К содержимому</a>
    <aside className="workspace-sidebar fixed inset-y-0 left-0 z-40 hidden w-[232px] text-white lg:block">{navigation()}</aside>
    <div className="min-w-0 lg:pl-[232px]">
      <header className="workspace-topbar sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-7">
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Открыть меню"><Menu className="size-5" /></Button></DialogTrigger>
          <DialogContent className="workspace-sidebar left-0 top-0 h-dvh w-[280px] max-w-[90vw] translate-x-0 translate-y-0 gap-0 rounded-none border-0 p-0 text-white sm:max-w-[280px]" aria-describedby={undefined}>
            <DialogTitle className="sr-only">Навигация</DialogTitle>{navigation()}
          </DialogContent>
        </Dialog>
        <div className="hidden items-center gap-2 text-sm sm:flex"><span className="text-muted-foreground">Моё пространство</span><span className="text-border">/</span><span className="font-semibold">{current?.href === "/dashboard" ? "Сегодня" : current?.title ?? "Обзор"}</span></div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <button onClick={() => setSearchOpen(true)} className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground hover:border-primary" aria-label="Найти раздел">
            <Search className="size-4" /><span className="hidden md:inline">Найти раздел</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button className="gap-1.5"><Plus className="size-4" /><span className="hidden sm:inline">Создать</span><ChevronDown className="size-3" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href="/tasks?create=1"><CheckSquare className="size-4" />Задачу</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/calendar?create=1"><CalendarDays className="size-4" />Событие</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/finances?create=1"><Wallet className="size-4" />Финансовую запись</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/subscriptions?create=1"><ArrowUpRight className="size-4" />Подписку</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle /><AccountMenu user={user} />
        </div>
      </header>
      <main tabIndex={-1} id="workspace-content" className="mx-auto min-w-0 max-w-[1800px] p-4 pb-28 md:p-7 md:pb-28 xl:p-9 xl:pb-28">{children}</main>
    </div>
    <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
  </div>;
}
