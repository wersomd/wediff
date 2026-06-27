"use server";

import { revalidatePath } from "next/cache";
import { TransactionType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
} from "./schema";
import { advanceByCycle } from "./billing";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

function revalidateSubs() {
  revalidatePath("/subscriptions");
}

// Subscription categories are expense categories, upserted by (name, type).
async function resolveCategoryId(name: string | null): Promise<string | null> {
  if (!name) return null;
  const cat = await db.category.upsert({
    where: { name_type: { name, type: TransactionType.EXPENSE } },
    create: { name, type: TransactionType.EXPENSE },
    update: {},
  });
  return cat.id;
}

function buildData(d: {
  name: string;
  amount: number;
  currency: string;
  billingCycle: import("@prisma/client").BillingCycle;
  nextPaymentDate: string;
  reminderDaysBefore: number;
  url?: string;
  icon?: string;
  categoryId: string | null;
  active: boolean;
}) {
  return {
    name: d.name,
    amount: d.amount,
    currency: d.currency,
    billingCycle: d.billingCycle,
    nextPaymentDate: new Date(`${d.nextPaymentDate}T00:00:00.000Z`),
    reminderDaysBefore: d.reminderDaysBefore,
    url: clean(d.url),
    icon: clean(d.icon),
    categoryId: d.categoryId,
    active: d.active,
  };
}

export async function createSubscription(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = subscriptionCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { category, ...rest } = parsed.data;
  const categoryId = await resolveCategoryId(clean(category));
  await db.subscription.create({ data: buildData({ ...rest, categoryId }) });
  revalidateSubs();
  return { ok: true };
}

export async function updateSubscription(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = subscriptionUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, category, ...rest } = parsed.data;
  const categoryId = await resolveCategoryId(clean(category));
  await db.subscription.update({
    where: { id },
    data: buildData({ ...rest, categoryId }),
  });
  revalidateSubs();
  return { ok: true };
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.subscription.delete({ where: { id } });
  revalidateSubs();
  return { ok: true };
}

export async function setSubscriptionActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  await requireAuth();
  await db.subscription.update({ where: { id }, data: { active } });
  revalidateSubs();
  return { ok: true };
}

// "Mark paid": roll the next payment date forward by one billing cycle.
export async function markSubscriptionPaid(id: string): Promise<ActionResult> {
  await requireAuth();
  const sub = await db.subscription.findUnique({
    where: { id },
    select: { nextPaymentDate: true, billingCycle: true },
  });
  if (!sub) return { error: "Подписка не найдена" };
  await db.subscription.update({
    where: { id },
    data: { nextPaymentDate: advanceByCycle(sub.nextPaymentDate, sub.billingCycle) },
  });
  revalidateSubs();
  return { ok: true };
}
