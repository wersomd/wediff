import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

// Native <input type="date"> emits "YYYY-MM-DD"; empty string means "no date".
const dueDate = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? new Date(`${v}T00:00:00`) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), {
    message: "Некорректная дата",
  });

const projectId = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Введите название").max(300),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate,
  projectId,
});

export const taskUpdateSchema = taskCreateSchema.extend({
  id: z.string().min(1),
});

export const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  toStatus: z.nativeEnum(TaskStatus),
  // The target column's task ids in their new order, including taskId.
  orderedIds: z.array(z.string().min(1)).min(1),
});

export type TaskCreateInput = z.input<typeof taskCreateSchema>;
export type TaskUpdateInput = z.input<typeof taskUpdateSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
