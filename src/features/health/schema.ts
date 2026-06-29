import { z } from "zod";

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

export const metricCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(60),
  unit: z.string().trim().max(12).optional().or(z.literal("")),
  icon: z.string().trim().max(8).optional().or(z.literal("")),
  target: z.preprocess(
    emptyToUndef,
    z.coerce.number().positive().optional(),
  ),
});

export const metricUpdateSchema = metricCreateSchema.extend({
  id: z.string().min(1),
});

export const logSaveSchema = z.object({
  metricId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
  value: z.coerce.number().finite("Введите число"),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export type MetricCreateInput = z.input<typeof metricCreateSchema>;
export type LogSaveInput = z.input<typeof logSaveSchema>;
