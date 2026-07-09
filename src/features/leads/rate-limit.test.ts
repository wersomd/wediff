import { describe, it, expect } from "vitest";
import { rateLimitKey } from "./rate-limit";

describe("rateLimitKey", () => {
  // Окно 60с; бакет = floor(ms / 60000). 960_000 = начало бакета 16.
  it("один IP в одном окне даёт один и тот же ключ", () => {
    const a = rateLimitKey("1.2.3.4", 960_000, 60); // бакет 16
    const b = rateLimitKey("1.2.3.4", 1_000_000, 60); // +40s, тот же бакет 16
    expect(a).toBe(b);
    expect(a).toContain("1.2.3.4");
  });

  it("следующее окно даёт другой ключ", () => {
    const a = rateLimitKey("1.2.3.4", 960_000, 60); // бакет 16
    const b = rateLimitKey("1.2.3.4", 1_020_000, 60); // бакет 17
    expect(a).not.toBe(b);
  });

  it("разные IP — разные ключи", () => {
    const a = rateLimitKey("1.2.3.4", 960_000, 60);
    const b = rateLimitKey("5.6.7.8", 960_000, 60);
    expect(a).not.toBe(b);
  });
});
