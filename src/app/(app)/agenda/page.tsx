import type { Metadata } from "next";
import { AgendaView } from "@/features/agenda/components/agenda-view";
import { getAgenda } from "@/features/agenda/queries";

export const metadata: Metadata = { title: "Повестка" };

export default async function AgendaPage() {
  const items = await getAgenda();
  return <AgendaView items={items} />;
}
