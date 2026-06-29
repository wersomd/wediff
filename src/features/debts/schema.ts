import { z } from "zod";
import { DebtDirection } from "@prisma/client";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата");

export const debtCreateSchema = z.object({
  counterparty: z.string().trim().min(1, "Укажите, с кем долг").max(120),
  direction: z.nativeEnum(DebtDirection),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  currency: z.enum(["KZT", "USD"]).default("KZT"),
  accountId: z.string().min(1, "Выберите счёт"),
  borrowedOn: dateStr,
  dueDate: dateStr.optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const paymentCreateSchema = z.object({
  debtId: z.string().min(1),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  accountId: z.string().min(1, "Выберите счёт"),
  paidOn: dateStr,
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type DebtCreateInput = z.input<typeof debtCreateSchema>;
export type PaymentCreateInput = z.input<typeof paymentCreateSchema>;
