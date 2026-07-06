import { z } from "zod";
import { DebtDirection, DebtKind } from "@prisma/client";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата");

export const debtCreateSchema = z
  .object({
    counterparty: z.string().trim().min(1, "Укажите, с кем долг").max(120),
    kind: z.nativeEnum(DebtKind).default(DebtKind.SIMPLE),
    direction: z.nativeEnum(DebtDirection),
    amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
    currency: z.enum(["KZT", "USD"]).default("KZT"),
    // SIMPLE only: when false, the debt is recorded without any account
    // transaction (old debts already out of the balance). Ignored for
    // INSTALLMENT, which never touches the balance on creation.
    affectsBalance: z.coerce.boolean().default(true),
    accountId: z.string().optional().or(z.literal("")),
    borrowedOn: dateStr,
    dueDate: dateStr.optional().or(z.literal("")),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    // INSTALLMENT only.
    termMonths: z.coerce.number().int().min(1).max(120).optional(),
    firstPaymentDate: dateStr.optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.kind === DebtKind.INSTALLMENT) {
      if (data.direction !== DebtDirection.I_OWE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["direction"],
          message: "Рассрочка доступна только для «я должен»",
        });
      }
      if (!data.termMonths) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["termMonths"],
          message: "Укажите срок в месяцах",
        });
      }
      if (!data.firstPaymentDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["firstPaymentDate"],
          message: "Укажите дату первого платежа",
        });
      }
    } else if (data.affectsBalance && !data.accountId) {
      // A balance-affecting simple debt must post through an account.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accountId"],
        message: "Выберите счёт",
      });
    }
  });

export const debtUpdateSchema = z.object({
  id: z.string().min(1),
  borrowedOn: dateStr,
  dueDate: dateStr.optional().or(z.literal("")),
});

export const paymentCreateSchema = z.object({
  debtId: z.string().min(1),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  accountId: z.string().min(1, "Выберите счёт"),
  paidOn: dateStr,
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const installmentPaySchema = z.object({
  installmentId: z.string().min(1),
  accountId: z.string().min(1, "Выберите счёт"),
  paidOn: dateStr,
});

export type DebtCreateInput = z.input<typeof debtCreateSchema>;
export type DebtUpdateInput = z.input<typeof debtUpdateSchema>;
export type PaymentCreateInput = z.input<typeof paymentCreateSchema>;
export type InstallmentPayInput = z.input<typeof installmentPaySchema>;
