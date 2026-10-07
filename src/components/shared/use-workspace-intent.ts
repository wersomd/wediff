"use client";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/** Consume an opening intent once; closing a dialog must not reopen it on refresh. */
export function useWorkspaceIntent({ onCreate, onItem }: { onCreate?: () => void; onItem?: (id: string) => void }) {
  const params = useSearchParams();
  const consumed = useRef<string | null>(null);
  useEffect(() => {
    const create = params.get("create");
    const item = params.get("item");
    const intent = `${create ?? ""}:${item ?? ""}`;
    if (!create && !item) { consumed.current = null; return; }
    if (consumed.current === intent) return;
    if ((create && onCreate) || (item && onItem)) {
      consumed.current = intent;
      const url = new URL(window.location.href);
      url.searchParams.delete("create");
      url.searchParams.delete("item");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      if (item && onItem) onItem(item);
      else if (create && onCreate) onCreate();
    }
  }, [params, onCreate, onItem]);
}
