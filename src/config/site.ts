export const siteConfig = {
  name: "Wediff",
  description: "Personal Life OS",
  defaultCurrency: "KZT",
  supportedCurrencies: ["KZT", "USD"] as const,
} as const;

export type Currency = (typeof siteConfig.supportedCurrencies)[number];
