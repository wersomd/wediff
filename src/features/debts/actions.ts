"use server";

import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import {
  DebtDirection,
  DebtKind,
  DebtStatus,
  InstallmentStatus,
  TransactionType,
  type Prisma,
} from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  debtCreateSchema,
  debtUpdateSchema,
  installmentPaySchema,
  paymentCreateSchema,
} from "./schema";
import { DEBT_CATEGORY } from "./constants";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function revalidateDebts() {
  revalidatePath("/debts");
  revalidatePath("/finances"); // balances changed
  revalidatePath("/dashboard"); // summary widget
}

// Disbursement: borrowing money is INCOME to my account; lending money is
// EXPENSE from it.
function disbursementType(direction: DebtDirection): TransactionType {
  return direction === DebtDirection.I_OWE
    ? TransactionType.INCOME
    : TransactionType.EXPENSE;
}

// Repayment is the mirror image: paying back my debt is EXPENSE; being repaid
// is INCOME.
function repaymentType(direction: DebtDirection): TransactionType {
  return direction === DebtDirection.I_OWE
    ? TransactionType.EXPENSE
    : TransactionType.INCOME;
}

async function resolveDebtCategory(
  tx: Prisma.TransactionClient,
  type: TransactionType,
): Promise<string> {
  const cat = await tx.category.upsert({
    where: { name_type: { name: DEBT_CATEGORY, type } },
    create: { name: DEBT_CATEGORY, type },
    update: {},
  });
  return cat.id;
}

// Splits a total into `months` equal monthly payments (working in whole cents so
// the parts always sum back to the total; the last month absorbs the remainder).
// Due dates run monthly from `firstDate`.
function buildSchedule(
  total: number,
  months: number,
  firstDate: Date,
): { seq: number; dueDate: Date; amount: number }[] {
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / months);
  const rows = [];
  for (let i = 0; i < months; i++) {
    const cents =
      i === months - 1 ? totalCents - baseCents * (months - 1) : baseCents;
    rows.push({
      seq: i + 1,
      dueDate: addMonths(firstDate, i),
      amount: cents / 100,
    });
  }
  return rows;
}

// ── Debts ───────────────────────────────────────────────────────────────────
export async function createDebt(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = debtCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const {
    counterparty,
    kind,
    direction,
    amount,
    currency,
    affectsBalance,
    accountId,
    borrowedOn,
    dueDate,
    description,
    termMonths,
    firstPaymentDate,
  } = parsed.data;

  const isInstallment = kind === DebtKind.INSTALLMENT;
  // An installment plan never posts to the balance on creation (goods received,
  // not cash). A simple debt only posts when the toggle is on.
  const posts = !isInstallment && affectsBalance;

  // A posting debt needs a matching-currency account to move money through.
  if (posts) {
    if (!accountId) return { error: "Выберите счёт" };
    const account = await db.account.findUnique({ where: { id: accountId } });
    if (!account) return { error: "Счёт не найден" };
    if (account.currency !== currency) {
      return {
        error: `Валюта счёта (${account.currency}) не совпадает с валютой долга (${currency})`,
      };
    }
  }

  await db.$transaction(async (tx) => {
    const cp = await tx.counterparty.upsert({
      where: { name: counterparty },
      create: { name: counterparty },
      update: {},
    });

    let disbursementTransactionId: string | null = null;
    if (posts) {
      const type = disbursementType(direction);
      const categoryId = await resolveDebtCategory(tx, type);
      const transaction = await tx.transaction.create({
        data: {
          type,
          amount,
          date: toDate(borrowedOn),
          accountId: accountId as string, // guaranteed by the `posts` guard above
          categoryId,
          note: `Долг: ${counterparty}${description ? ` — ${description}` : ""}`,
        },
      });
      disbursementTransactionId = transaction.id;
    }

    const debt = await tx.debt.create({
      data: {
        counterpartyId: cp.id,
        kind,
        direction: isInstallment ? DebtDirection.I_OWE : direction,
        principal: amount,
        currency,
        description: clean(description),
        borrowedOn: toDate(borrowedOn),
        dueDate: dueDate ? toDate(dueDate) : null,
        disbursementTransactionId,
      },
    });

    if (isInstallment && termMonths && firstPaymentDate) {
      const schedule = buildSchedule(
        amount,
        termMonths,
        toDate(firstPaymentDate),
      );
      await tx.debtInstallment.createMany({
        data: schedule.map((s) => ({
          debtId: debt.id,
          seq: s.seq,
          dueDate: s.dueDate,
          amount: s.amount,
        })),
      });
    }
  });
  revalidateDebts();
  return { ok: true };
}

// Edits a debt's dates. The borrow date is kept in sync with the disbursement
// transaction so the finance books show the same date as the debt.
export async function updateDebt(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = debtUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, borrowedOn, dueDate } = parsed.data;

  const debt = await db.debt.findUnique({
    where: { id },
    select: { disbursementTransactionId: true },
  });
  if (!debt) return { error: "Долг не найден" };

  await db.$transaction(async (tx) => {
    await tx.debt.update({
      where: { id },
      data: {
        borrowedOn: toDate(borrowedOn),
        dueDate: dueDate ? toDate(dueDate) : null,
      },
    });
    if (debt.disbursementTransactionId) {
      await tx.transaction.update({
        where: { id: debt.disbursementTransactionId },
        data: { date: toDate(borrowedOn) },
      });
    }
  });
  revalidateDebts();
  return { ok: true };
}

// Deletes a debt, its payments (cascade), and every linked Transaction so the
// finance books roll back cleanly. The counterparty row is left in place.
export async function deleteDebt(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  const debt = await db.debt.findUnique({
    where: { id },
    include: { payments: { select: { transactionId: true } } },
  });
  if (!debt) return { error: "Долг не найден" };

  const txIds = [
    debt.disbursementTransactionId,
    ...debt.payments.map((p) => p.transactionId),
  ].filter((x): x is string => Boolean(x));

  await db.$transaction(async (tx) => {
    await tx.debt.delete({ where: { id } }); // payments cascade
    if (txIds.length) {
      await tx.transaction.deleteMany({ where: { id: { in: txIds } } });
    }
  });
  revalidateDebts();
  return { ok: true };
}

// ── Payments ──────────────────────────────────────────────────────────────────
export async function addPayment(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = paymentCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { debtId, amount, accountId, paidOn, note } = parsed.data;

  const debt = await db.debt.findUnique({
    where: { id: debtId },
    include: {
      payments: { select: { amount: true } },
      counterparty: { select: { name: true } },
    },
  });
  if (!debt) return { error: "Долг не найден" };

  const account = await db.account.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Счёт не найден" };
  if (account.currency !== debt.currency) {
    return {
      error: `Валюта счёта (${account.currency}) не совпадает с валютой долга (${debt.currency})`,
    };
  }

  const paid = debt.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
  const remaining = debt.principal.toNumber() - paid;
  if (amount > remaining + 1e-6) {
    return { error: `Сумма больше остатка (${remaining})` };
  }

  const type = repaymentType(debt.direction);
  const fullyPaid = remaining - amount <= 1e-6;

  await db.$transaction(async (tx) => {
    const categoryId = await resolveDebtCategory(tx, type);
    const transaction = await tx.transaction.create({
      data: {
        type,
        amount,
        date: toDate(paidOn),
        accountId,
        categoryId,
        note: `Погашение долга: ${debt.counterparty.name}`,
      },
    });
    await tx.debtPayment.create({
      data: {
        debtId,
        amount,
        paidOn: toDate(paidOn),
        note: clean(note),
        transactionId: transaction.id,
      },
    });
    if (fullyPaid) {
      await tx.debt.update({
        where: { id: debtId },
        data: { status: DebtStatus.PAID },
      });
    }
  });
  revalidateDebts();
  return { ok: true };
}

// Removes a payment, its linked Transaction, and reopens the debt (a removed
// payment means it is no longer fully settled).
export async function deletePayment(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  const payment = await db.debtPayment.findUnique({ where: { id } });
  if (!payment) return { error: "Платёж не найден" };

  await db.$transaction(async (tx) => {
    if (payment.transactionId) {
      await tx.transaction.deleteMany({ where: { id: payment.transactionId } });
    }
    await tx.debtPayment.delete({ where: { id } });
    await tx.debt.update({
      where: { id: payment.debtId },
      data: { status: DebtStatus.OPEN },
    });
  });
  revalidateDebts();
  return { ok: true };
}

// ── Installments ──────────────────────────────────────────────────────────────
// Pays one scheduled month of an installment plan: posts a real expense to the
// chosen account, records a DebtPayment (so paid/remaining reuse the same math),
// and marks the month PAID. Closes the debt when the last month is paid.
export async function payInstallment(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = installmentPaySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { installmentId, accountId, paidOn } = parsed.data;

  const installment = await db.debtInstallment.findUnique({
    where: { id: installmentId },
    include: {
      debt: {
        include: {
          counterparty: { select: { name: true } },
          installments: { select: { id: true, status: true } },
        },
      },
    },
  });
  if (!installment) return { error: "Платёж не найден" };
  if (installment.status === InstallmentStatus.PAID) {
    return { error: "Этот месяц уже оплачен" };
  }
  const { debt } = installment;

  const account = await db.account.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Счёт не найден" };
  if (account.currency !== debt.currency) {
    return {
      error: `Валюта счёта (${account.currency}) не совпадает с валютой долга (${debt.currency})`,
    };
  }

  const amount = installment.amount.toNumber();
  const total = debt.installments.length;
  // All other months already paid → this payment closes the debt.
  const lastOpen =
    debt.installments.filter((i) => i.status !== InstallmentStatus.PAID)
      .length === 1;
  const type = repaymentType(debt.direction);

  await db.$transaction(async (tx) => {
    const categoryId = await resolveDebtCategory(tx, type);
    const transaction = await tx.transaction.create({
      data: {
        type,
        amount,
        date: toDate(paidOn),
        accountId,
        categoryId,
        note: `Рассрочка ${installment.seq}/${total}: ${debt.counterparty.name}`,
      },
    });
    const payment = await tx.debtPayment.create({
      data: {
        debtId: debt.id,
        amount,
        paidOn: toDate(paidOn),
        transactionId: transaction.id,
        note: `Платёж ${installment.seq}/${total}`,
      },
    });
    await tx.debtInstallment.update({
      where: { id: installmentId },
      data: {
        status: InstallmentStatus.PAID,
        paidOn: toDate(paidOn),
        paymentId: payment.id,
      },
    });
    if (lastOpen) {
      await tx.debt.update({
        where: { id: debt.id },
        data: { status: DebtStatus.PAID },
      });
    }
  });
  revalidateDebts();
  return { ok: true };
}

// Reverses an installment payment: removes its transaction + DebtPayment, sets
// the month back to PENDING and reopens the debt.
export async function unpayInstallment(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  const installment = await db.debtInstallment.findUnique({
    where: { id },
    include: { payment: { select: { id: true, transactionId: true } } },
  });
  if (!installment) return { error: "Платёж не найден" };
  if (installment.status !== InstallmentStatus.PAID) {
    return { error: "Этот месяц не оплачен" };
  }

  await db.$transaction(async (tx) => {
    await tx.debtInstallment.update({
      where: { id },
      data: {
        status: InstallmentStatus.PENDING,
        paidOn: null,
        paymentId: null,
      },
    });
    if (installment.payment) {
      await tx.debtPayment.delete({ where: { id: installment.payment.id } });
      if (installment.payment.transactionId) {
        await tx.transaction.deleteMany({
          where: { id: installment.payment.transactionId },
        });
      }
    }
    await tx.debt.update({
      where: { id: installment.debtId },
      data: { status: DebtStatus.OPEN },
    });
  });
  revalidateDebts();
  return { ok: true };
}
