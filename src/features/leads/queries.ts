import "server-only";
import { db } from "@/lib/db";

// Заявки в инбоксе: новые сверху.
export async function getLeads() {
  return db.lead.findMany({ orderBy: { createdAt: "desc" } });
}

export type LeadRow = Awaited<ReturnType<typeof getLeads>>[number];
