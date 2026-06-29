import { z } from "zod";

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

export const journalSaveSchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
  mood: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().min(1).max(5).optional(),
  ),
  content: z.string().trim().max(20000).optional().or(z.literal("")),
});

export type JournalSaveInput = z.input<typeof journalSaveSchema>;
