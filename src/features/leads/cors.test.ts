import { describe, it, expect, afterEach } from "vitest";
import { allowedOrigin, isOriginAllowed, corsHeaders } from "./cors";

const ORIGIN = "https://wersomd.github.io";

describe("cors", () => {
  const prev = process.env.LEADS_ALLOWED_ORIGIN;
  afterEach(() => { process.env.LEADS_ALLOWED_ORIGIN = prev; });

  it("allowedOrigin отдаёт дефолт, если env не задан", () => {
    delete process.env.LEADS_ALLOWED_ORIGIN;
    expect(allowedOrigin()).toBe(ORIGIN);
  });

  it("isOriginAllowed пропускает совпадающий origin", () => {
    process.env.LEADS_ALLOWED_ORIGIN = ORIGIN;
    expect(isOriginAllowed(ORIGIN)).toBe(true);
    expect(isOriginAllowed("https://evil.example")).toBe(false);
  });

  it("isOriginAllowed пропускает всё, если env не задан (dev)", () => {
    delete process.env.LEADS_ALLOWED_ORIGIN;
    expect(isOriginAllowed("https://anything.example")).toBe(true);
  });

  it("corsHeaders содержит нужные ключи", () => {
    const h = corsHeaders(ORIGIN);
    expect(h["Access-Control-Allow-Origin"]).toBe(ORIGIN);
    expect(h["Access-Control-Allow-Methods"]).toContain("POST");
    expect(h["Access-Control-Allow-Headers"]).toContain("x-lead-token");
  });
});
