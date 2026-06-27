import { z } from "zod";

const projectId = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const noteCreateSchema = z.object({
  title: z.string().trim().min(1, "Введите заголовок").max(300),
  content: z.string().max(50000).optional().or(z.literal("")),
  pinned: z.boolean().default(false),
  projectId,
  tags: z.array(z.string().trim().min(1)).default([]),
});

export const noteUpdateSchema = noteCreateSchema.extend({
  id: z.string().min(1),
});

export type NoteCreateInput = z.input<typeof noteCreateSchema>;
export type NoteUpdateInput = z.input<typeof noteUpdateSchema>;
