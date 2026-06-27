import { z } from "zod";

// Only http(s) — block javascript:/data: hrefs that would execute on click.
const httpUrl = z
  .string()
  .trim()
  .url("Введите корректный URL")
  .refine((v) => {
    try {
      const p = new URL(v).protocol;
      return p === "http:" || p === "https:";
    } catch {
      return false;
    }
  }, "Только http(s) ссылки");

export const bookmarkCreateSchema = z.object({
  url: httpUrl,
  title: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  isArchived: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export const bookmarkUpdateSchema = bookmarkCreateSchema.extend({
  id: z.string().min(1),
});

export type BookmarkCreateInput = z.input<typeof bookmarkCreateSchema>;
export type BookmarkUpdateInput = z.input<typeof bookmarkUpdateSchema>;
