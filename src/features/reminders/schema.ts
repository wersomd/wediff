import { z } from "zod";
export const reminderSettingsSchema = z.object({ enabled: z.boolean(), tasks: z.boolean(), projects: z.boolean(), debts: z.boolean(), subscriptions: z.boolean() });
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { enabled: true, tasks: true, projects: true, debts: true, subscriptions: true };
