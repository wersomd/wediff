import { z } from "zod";
import { WishStatus, WishType } from "@prisma/client";

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

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

export const wishCreateSchema = z.object({
  title: z.string().trim().min(1, "Введите название").max(200),
  type: z.nativeEnum(WishType).default(WishType.OTHER),
  status: z.nativeEnum(WishStatus).default(WishStatus.WANT),
  url: optionalHttpUrl,
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  rating: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().min(1).max(5).optional(),
  ),
  price: z.preprocess(emptyToUndef, z.coerce.number().positive().optional()),
  currency: z.enum(["KZT", "USD"]).optional(),
});

export const wishUpdateSchema = wishCreateSchema.extend({
  id: z.string().min(1),
});

export type WishCreateInput = z.input<typeof wishCreateSchema>;
