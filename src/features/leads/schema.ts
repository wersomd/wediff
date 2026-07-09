import { z } from "zod";

export const leadInboundSchema = z.object({
  name: z.string().trim().min(1, "Введите имя").max(120),
  contact: z.string().trim().min(1, "Введите контакт").max(160),
  message: z.string().trim().max(2000).optional().default(""),
  source: z.string().trim().max(120).optional().default("wersomd.github.io"),
  website: z.string().optional().default(""), // honeypot: люди оставляют пустым
});

export type LeadInboundInput = z.input<typeof leadInboundSchema>;
export type LeadInboundData = z.output<typeof leadInboundSchema>;

export const leadStatusSchema = z.enum(["NEW", "CONTACTED", "ARCHIVED"]);
