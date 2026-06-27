"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function QuickAdd({
  onAdd,
  placeholder = "Добавить задачу",
  className,
}: {
  onAdd: (title: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState("");

  function commit() {
    const title = value.trim();
    if (title) onAdd(title);
    setValue("");
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          className,
        )}
      >
        <Plus className="size-4" />
        {placeholder}
      </button>
    );
  }

  return (
    <Input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={cn("h-9", className)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
          // keep adding: input stays focused for the next one
        } else if (e.key === "Escape") {
          setValue("");
          setActive(false);
        }
      }}
      onBlur={() => {
        commit();
        setActive(false);
      }}
    />
  );
}
