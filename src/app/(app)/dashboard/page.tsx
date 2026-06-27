import Link from "next/link";
import type { Metadata } from "next";
import { mainNav } from "@/config/nav";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Dashboard" };

const phaseByHref: Record<string, string> = {
  "/tasks": "Phase 2",
  "/projects": "Phase 2",
  "/notes": "Phase 3",
  "/links": "Phase 3",
  "/habits": "Phase 4",
  "/finances": "Phase 5",
  "/subscriptions": "Phase 5",
  "/files": "Phase 6",
};

export default function DashboardPage() {
  const modules = mainNav.filter((m) => m.href !== "/dashboard");

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your whole life, one screen. Live summaries arrive in Phase 7."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="group rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="text-xs text-muted-foreground">
                  {phaseByHref[m.href]}
                </span>
              </div>
              <h3 className="mt-4 font-medium">{m.title}</h3>
            </Link>
          );
        })}
      </div>
    </>
  );
}
