"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  accountCreateSchema,
  accountUpdateSchema,
  budgetSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
  transferSchema,
} from "./schema";
import { TransactionType } from "@prisma/client";

// Service category for the paired transactions of an account-to-account
// transfer, so transfers don't read as real income/expense in analytics.
const TRANSFER_CATEGORY = "Перевод";

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

// ── Transfers ─────────────────────────────────────────────────────────────────
// A transfer is a paired EXPENSE (from) + INCOME (to) in the "Перевод" category.
// Both accounts must share a currency — no FX conversion.
export async function createTransfer(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { fromAccountId, toAccountId, amount, date, note } = parsed.data;

  const [from, to] = await Promise.all([
    db.account.findUnique({ where: { id: fromAccountId } }),
    db.account.findUnique({ where: { id: toAccountId } }),
  ]);
  if (!from || !to) return { error: "Счёт не найден" };
  if (from.currency !== to.currency) {
    return { error: "Перевод возможен только между счетами одной валюты" };
  }

  const when = new Date(`${date}T00:00:00.000Z`);
  const label = `${TRANSFER_CATEGORY}: ${from.name} → ${to.name}${note ? ` — ${note.trim()}` : ""}`;
  await db.$transaction(async (tx) => {
    const expenseCat = await tx.category.upsert({
      where: { name_type: { name: TRANSFER_CATEGORY, type: TransactionType.EXPENSE } },
      create: { name: TRANSFER_CATEGORY, type: TransactionType.EXPENSE },
      update: {},
    });
    const incomeCat = await tx.category.upsert({
      where: { name_type: { name: TRANSFER_CATEGORY, type: TransactionType.INCOME } },
      create: { name: TRANSFER_CATEGORY, type: TransactionType.INCOME },
      update: {},
    });
    await tx.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        amount,
        date: when,
        accountId: fromAccountId,
        categoryId: expenseCat.id,
        note: label,
      },
    });
    await tx.transaction.create({
      data: {
        type: TransactionType.INCOME,
        amount,
        date: when,
        accountId: toAccountId,
        categoryId: incomeCat.id,
        note: label,
      },
    });
  });
  revalidateFinances();
  return { ok: true };
}

// ── Budgets ───────────────────────────────────────────────────────────────────
export async function setBudget(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { categoryId, amount } = parsed.data;
  await db.budget.upsert({
    where: { categoryId },
    create: { categoryId, amount },
    update: { amount },
  });
  revalidateFinances();
  return { ok: true };
}

export async function deleteBudget(categoryId: string): Promise<ActionResult> {
  await requireAuth();
  if (!categoryId) return { error: "Нет категории" };
  await db.budget.deleteMany({ where: { categoryId } });
  revalidateFinances();
  return { ok: true };
}
