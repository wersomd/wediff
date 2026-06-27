"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  accountCreateSchema,
  accountUpdateSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
} from "./schema";
import type { TransactionType } from "@prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

function revalidateFinances() {
  revalidatePath("/finances");
}

// ── Accounts ──────────────────────────────────────────────────────────────
export async function createAccount(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = accountCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { name, type, currency, startBalance } = parsed.data;
  await db.account.create({ data: { name, type, currency, startBalance } });
  revalidateFinances();
  return { ok: true };
}

export async function updateAccount(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = accountUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, name, type, currency, startBalance } = parsed.data;
  await db.account.update({
    where: { id },
    data: { name, type, currency, startBalance },
  });
  revalidateFinances();
  return { ok: true };
}

// Deleting an account cascades its transactions (Transaction.accountId Cascade).
export async function deleteAccount(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.account.delete({ where: { id } });
  revalidateFinances();
  return { ok: true };
}

export async function setAccountArchived(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  await requireAuth();
  await db.account.update({ where: { id }, data: { archived } });
  revalidateFinances();
  return { ok: true };
}

// ── Transactions ────────────────────────────────────────────────────────────
async function resolveCategoryId(
  name: string | null,
  type: TransactionType,
): Promise<string | null> {
  if (!name) return null;
  const cat = await db.category.upsert({
    where: { name_type: { name, type } },
    create: { name, type },
    update: {},
  });
  return cat.id;
}

export async function createTransaction(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = transactionCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { type, amount, date, accountId, category, note } = parsed.data;
  const categoryId = await resolveCategoryId(clean(category), type);
  await db.transaction.create({
    data: {
      type,
      amount,
      date: new Date(`${date}T00:00:00.000Z`),
      accountId,
      categoryId,
      note: clean(note),
    },
  });
  revalidateFinances();
  return { ok: true };
}

export async function updateTransaction(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = transactionUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, type, amount, date, accountId, category, note } = parsed.data;
  const categoryId = await resolveCategoryId(clean(category), type);
  await db.transaction.update({
    where: { id },
    data: {
      type,
      amount,
      date: new Date(`${date}T00:00:00.000Z`),
      accountId,
      categoryId,
      note: clean(note),
    },
  });
  revalidateFinances();
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.transaction.delete({ where: { id } });
  revalidateFinances();
  return { ok: true };
}
