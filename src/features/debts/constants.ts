import { DebtDirection, DebtKind } from "@prisma/client";

export const DEBT_DIRECTION_LABELS: Record<DebtDirection, string> = {
  I_OWE: "Я должен",
  OWED_TO_ME: "Мне должны",
};

export const DEBT_KIND_LABELS: Record<DebtKind, string> = {
  SIMPLE: "Обычный",
  INSTALLMENT: "Рассрочка",
};

// Service category name used for debt-driven transactions in Finances, so they
// don't pollute normal spend analytics and can be filtered out later.
export const DEBT_CATEGORY = "Долги";
