import { z } from "zod";
import { BillingCycle } from "@prisma/client";

const optionalHttpUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => {
      if (!v) return true;
      try {
        const p = new URL(v).protocol;
        return p === "http:" || p === "https:";
      } catch {
        return false;
      }
    },
    { message: "Только http(s) ссылки" },
  );

export const subscriptionCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  currency: z.enum(["KZT", "USD"]).default("KZT"),
  billingCycle: z.nativeEnum(BillingCycle).default(BillingCycle.MONTHLY),
  nextPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
  reminderDaysBefore: z.coerce.number().int().min(0).max(60).default(3),
  url: optionalHttpUrl,
  icon: z.string().trim().max(8).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export const subscriptionUpdateSchema = subscriptionCreateSchema.extend({
  id: z.string().min(1),
});

export type SubscriptionCreateInput = z.input<typeof subscriptionCreateSchema>;
