const SYMBOLS: Record<string, string> = {
  KZT: "₸",
  USD: "$",
};

// Format a money amount (already a plain number) with a currency suffix.
export function formatMoney(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${SYMBOLS[currency] ?? currency}`;
}

export const CURRENCIES = ["KZT", "USD"] as const;
