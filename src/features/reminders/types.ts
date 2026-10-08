export type ReminderItem = { id: string; kind: "task" | "project" | "debt" | "subscription"; title: string; dueDate: Date; href: string; detail?: string };
export type DeliveryResult = { status: "sent" | "failed" | "unknown"; errorCode?: string; retryAfter?: number };
