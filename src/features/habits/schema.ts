import { z } from "zod";
import { HabitFrequency } from "@prisma/client";

export const habitCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional().or(z.literal("")),
  icon: z.string().trim().max(8).optional().or(z.literal("")),
  frequency: z.nativeEnum(HabitFrequency).default(HabitFrequency.DAILY),
  target: z.coerce.number().int().min(1).max(7).default(1),
});

export const habitUpdateSchema = habitCreateSchema.extend({
  id: z.string().min(1),
});

// A day key in YYYY-MM-DD form (local calendar day from the client).
export const toggleEntrySchema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
});

export type HabitCreateInput = z.input<typeof habitCreateSchema>;
export type HabitUpdateInput = z.input<typeof habitUpdateSchema>;
