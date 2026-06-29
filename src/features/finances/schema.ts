import { z } from "zod";
import { AccountType, TransactionType } from "@prisma/client";

export const accountCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120),
  type: z.nativeEnum(AccountType).default(AccountType.CARD),
  currency: z.enum(["KZT", "USD"]).default("KZT"),
  startBalance: z.coerce.number().finite().default(0),
});

export const accountUpdateSchema = accountCreateSchema.extend({
  id: z.string().min(1),
});

export const transactionCreateSchema = z.object({
  type: z.nativeEnum(TransactionType).default(TransactionType.EXPENSE),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
  accountId: z.string().min(1, "Выберите счёт"),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const transactionUpdateSchema = transactionCreateSchema.extend({
  id: z.string().min(1),
});

export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Выберите счёт списания"),
    toAccountId: z.string().min(1, "Выберите счёт зачисления"),
    amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((d) => d.fromAccountId !== d.toAccountId, {
    message: "Счета должны отличаться",
    path: ["toAccountId"],
  });

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Выберите категорию"),
  amount: z.coerce.number().positive("Лимит должен быть больше нуля"),
});

export type AccountCreateInput = z.input<typeof accountCreateSchema>;
export type TransactionCreateInput = z.input<typeof transactionCreateSchema>;
export type TransferInput = z.input<typeof transferSchema>;
