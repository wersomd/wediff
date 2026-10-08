export type PaymentObligation = {
 id: string; kind: "debt" | "subscription"; direction: "incoming" | "outgoing";
 title: string; amount: string; currency: string; dueDate: Date; reminderDaysBefore: number; href: string;
};
