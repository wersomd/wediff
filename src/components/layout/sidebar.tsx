"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav, footerNav, type NavItem } from "@/config/nav";
import { siteConfig } from "@/config/site";

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {item.title}
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2.5 px-2 py-2"
      >
        <span className="size-6 rounded-md bg-primary" />
        <span className="text-lg font-semibold tracking-tight">
          {siteConfig.name}
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <nav className="flex flex-col gap-0.5 border-t border-border pt-2">
        {footerNav.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
      <div className="sticky top-0 h-dvh">
        <SidebarNav />
      </div>
    </aside>
  );
}
