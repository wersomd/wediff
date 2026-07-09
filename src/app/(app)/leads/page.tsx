import type { Metadata } from "next";
import { getLeads } from "@/features/leads/queries";
import { LeadsView } from "@/features/leads/components/leads-view";

export const metadata: Metadata = { title: "Заявки" };

export default async function LeadsPage() {
  const leads = await getLeads();
  return <LeadsView initialLeads={leads} />;
}
