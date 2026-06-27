"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TagsInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Добавить тег…",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const listId = useId();
  const [input, setInput] = useState("");

  function add(name: string) {
    const n = name.trim();
    if (n && !value.includes(n)) onChange([...value, n]);
    setInput("");
  }

  function remove(name: string) {
    onChange(value.filter((t) => t !== name));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                aria-label={`Убрать тег ${tag}`}
                className="rounded-full hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={input}
        list={listId}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(input);
          } else if (e.key === "Backspace" && !input && value.length) {
            remove(value[value.length - 1]);
          }
        }}
        onBlur={() => add(input)}
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
