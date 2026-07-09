"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Inbox, Check, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { setLeadStatus, deleteLead } from "../actions";
import type { LeadRow } from "../queries";

const ALL = "ALL";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Новая",
  CONTACTED: "В работе",
  ARCHIVED: "Архив",
};

function contactLinks(contact: string): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  const digits = contact.replace(/[^\d]/g, "");
  if (digits.length >= 10) {
    links.push({ href: `https://wa.me/${digits}`, label: "WhatsApp" });
    links.push({ href: `tel:+${digits}`, label: "Позвонить" });
  }
  const tg = contact.match(/@([A-Za-z0-9_]{3,})/);
  if (tg) links.push({ href: `https://t.me/${tg[1]}`, label: "Telegram" });
  return links;
}

export function LeadsView({ initialLeads }: { initialLeads: LeadRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [filter, setFilter] = useState<string>(ALL);

  const leads = useMemo(
    () => (filter === ALL ? initialLeads : initialLeads.filter((l) => l.status === filter)),
    [initialLeads, filter],
  );

  function refresh() {
    start(() => router.refresh());
  }

  async function onStatus(id: string, status: string) {
    const res = await setLeadStatus(id, status);
    if ("error" in res) return toast.error(res.error);
    toast.success("Обновлено");
    refresh();
  }

  async function onDelete(id: string) {
    const res = await deleteLead(id);
    if ("error" in res) return toast.error(res.error);
    toast.success("Удалено");
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Заявки" description="Заявки с сайта" />

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Все</SelectItem>
          <SelectItem value="NEW">Новые</SelectItem>
          <SelectItem value="CONTACTED">В работе</SelectItem>
          <SelectItem value="ARCHIVED">Архив</SelectItem>
        </SelectContent>
      </Select>

      {leads.length === 0 ? (
        <EmptyState icon={Inbox} title="Заявок пока нет" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {leads.map((lead) => (
            <Card key={lead.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{lead.name}</span>
                <Badge variant="secondary">{STATUS_LABEL[lead.status] ?? lead.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{lead.contact}</div>
              {lead.message ? <p className="text-sm">{lead.message}</p> : null}
              <div className="text-xs text-muted-foreground">
                {new Date(lead.createdAt).toLocaleString("ru-RU")} · {lead.source}
              </div>

              <div className="flex flex-wrap gap-2">
                {contactLinks(lead.contact).map((l) => (
                  <Button key={l.label} asChild size="sm" variant="outline">
                    <a href={l.href} target="_blank" rel="noopener">{l.label}</a>
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => onStatus(lead.id, "CONTACTED")}>
                  <Check className="mr-1 h-4 w-4" /> Связался
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onStatus(lead.id, "ARCHIVED")}>
                  <Archive className="mr-1 h-4 w-4" /> В архив
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(lead.id)}>
                  <Trash2 className="mr-1 h-4 w-4" /> Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
