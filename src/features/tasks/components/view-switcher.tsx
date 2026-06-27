"use client";

import { KanbanSquare, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskView = "board" | "list";

export function ViewSwitcher({
  view,
  onChange,
}: {
  view: TaskView;
  onChange: (view: TaskView) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      <Tab active={view === "board"} onClick={() => onChange("board")}>
        <KanbanSquare className="size-4" />
        Доска
      </Tab>
      <Tab active={view === "list"} onClick={() => onChange("list")}>
        <List className="size-4" />
        Список
      </Tab>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
