"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadStatusSchema } from "./schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

export async function setLeadStatus(id: string, status: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = leadStatusSchema.safeParse(status);
  if (!parsed.success) return { error: "Неверный статус" };
  await db.lead.update({ where: { id }, data: { status: parsed.data } });
  revalidatePath("/leads");
  return { ok: true };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  await requireAuth();
  await db.lead.delete({ where: { id } });
  revalidatePath("/leads");
  return { ok: true };
}
