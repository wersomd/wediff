import { AccountType, TransactionType } from "@prisma/client";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Наличные",
  CARD: "Карта",
  BANK: "Банк",
  SAVINGS: "Накопления",
  OTHER: "Другое",
};

export const ACCOUNT_TYPE_ORDER: AccountType[] = [
  AccountType.CARD,
  AccountType.CASH,
  AccountType.BANK,
  AccountType.SAVINGS,
  AccountType.OTHER,
];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Доход",
  EXPENSE: "Расход",
};
