import { z } from "zod";

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата")
  .optional()
  .or(z.literal(""));

export const goalCreateSchema = z.object({
  title: z.string().trim().min(1, "Введите название").max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  targetValue: z.preprocess(
    emptyToUndef,
    z.coerce.number().positive("Цель должна быть больше нуля").optional(),
  ),
  currentValue: z.preprocess(
    emptyToUndef,
    z.coerce.number().min(0).optional(),
  ),
  unit: z.string().trim().max(20).optional().or(z.literal("")),
  dueDate: dateStr,
});

export const goalUpdateSchema = goalCreateSchema.extend({
  id: z.string().min(1),
});

export const keyResultCreateSchema = z.object({
  goalId: z.string().min(1),
  title: z.string().trim().min(1, "Введите результат").max(160),
});

export type GoalCreateInput = z.input<typeof goalCreateSchema>;
