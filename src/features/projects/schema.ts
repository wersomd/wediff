import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Цвет должен быть в формате #RRGGBB");

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE),
  color: hexColor.optional().or(z.literal("")),
});

export const projectUpdateSchema = projectCreateSchema.extend({
  id: z.string().min(1),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
