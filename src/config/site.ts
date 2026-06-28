export const siteConfig = {
  name: "Wediff",
  description: "Личная операционная система для жизни",
  defaultCurrency: "KZT",
  supportedCurrencies: ["KZT", "USD"] as const,
} as const;

export type Currency = (typeof siteConfig.supportedCurrencies)[number];
