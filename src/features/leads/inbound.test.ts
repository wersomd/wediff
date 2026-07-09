import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { handleInboundLead, type LeadPayload } from "./inbound";

function makeDeps() {
  const created: LeadPayload[] = [];
  const notified: LeadPayload[] = [];
  return {
    created,
    notified,
    deps: {
      createLead: async (d: LeadPayload) => { created.push(d); },
      notify: async (l: LeadPayload) => { notified.push(l); },
    },
  };
}

const OK_CTX = { origin: null, token: null };

describe("handleInboundLead", () => {
  const prevOrigin = process.env.LEADS_ALLOWED_ORIGIN;
  const prevToken = process.env.LEADS_INBOUND_TOKEN;
  beforeEach(() => {
    delete process.env.LEADS_ALLOWED_ORIGIN;
    delete process.env.LEADS_INBOUND_TOKEN;
  });
  afterEach(() => {
    process.env.LEADS_ALLOWED_ORIGIN = prevOrigin;
    process.env.LEADS_INBOUND_TOKEN = prevToken;
  });

  it("создаёт лид и уведомляет при валидном теле", async () => {
    const { created, notified, deps } = makeDeps();
    const r = await handleInboundLead(
      { name: "Иван", contact: "+7700", message: "сайт" },
      OK_CTX,
      deps,
    );
    expect(r).toEqual({ status: 200, body: { ok: true } });
    expect(created).toHaveLength(1);
    expect(created[0].source).toBe("wersomd.github.io");
    expect(notified).toHaveLength(1);
  });

  it("honeypot: не создаёт лид, но отвечает 200", async () => {
    const { created, deps } = makeDeps();
    const r = await handleInboundLead(
      { name: "Bot", contact: "x", website: "http://spam" },
      OK_CTX,
      deps,
    );
    expect(r.status).toBe(200);
    expect(created).toHaveLength(0);
  });

  it("невалидное тело → 400", async () => {
    const { deps } = makeDeps();
    const r = await handleInboundLead({ name: "", contact: "" }, OK_CTX, deps);
    expect(r.status).toBe(400);
  });

  it("чужой origin → 403, если LEADS_ALLOWED_ORIGIN задан", async () => {
    process.env.LEADS_ALLOWED_ORIGIN = "https://wersomd.github.io";
    const { created, deps } = makeDeps();
    const r = await handleInboundLead(
      { name: "Иван", contact: "x" },
      { origin: "https://evil.example", token: null },
      deps,
    );
    expect(r.status).toBe(403);
    expect(created).toHaveLength(0);
  });

  it("неверный токен → 403, если LEADS_INBOUND_TOKEN задан", async () => {
    process.env.LEADS_INBOUND_TOKEN = "secret";
    const { deps } = makeDeps();
    const r = await handleInboundLead(
      { name: "Иван", contact: "x" },
      { origin: null, token: "wrong" },
      deps,
    );
    expect(r.status).toBe(403);
  });

  it("ошибка notify не роняет запрос", async () => {
    const { created } = makeDeps();
    const deps = {
      createLead: async (d: LeadPayload) => { created.push(d); },
      notify: async () => { throw new Error("telegram down"); },
    };
    const r = await handleInboundLead({ name: "Иван", contact: "x" }, OK_CTX, deps);
    expect(r.status).toBe(200);
    expect(created).toHaveLength(1);
  });

  it("тайминг-ловушка: слишком быстрый сабмит не создаёт лид, но 200", async () => {
    const { created, deps } = makeDeps();
    const r = await handleInboundLead(
      { name: "Bot", contact: "x", elapsed: 300 },
      OK_CTX,
      deps,
    );
    expect(r.status).toBe(200);
    expect(created).toHaveLength(0);
  });

  it("нормальное время заполнения — лид создаётся", async () => {
    const { created, deps } = makeDeps();
    const r = await handleInboundLead(
      { name: "Иван", contact: "x", elapsed: 8000 },
      OK_CTX,
      deps,
    );
    expect(r.status).toBe(200);
    expect(created).toHaveLength(1);
  });

  it("превышение rate-limit → 429, лид не создаётся", async () => {
    const { created, deps } = makeDeps();
    const r = await handleInboundLead(
      { name: "Иван", contact: "x" },
      { origin: null, token: null, ip: "1.2.3.4" },
      { ...deps, checkRateLimit: async () => false },
    );
    expect(r.status).toBe(429);
    expect(created).toHaveLength(0);
  });

  it("в пределах лимита — лид создаётся, IP сохраняется", async () => {
    const { created, deps } = makeDeps();
    const r = await handleInboundLead(
      { name: "Иван", contact: "x" },
      { origin: null, token: null, ip: "1.2.3.4" },
      { ...deps, checkRateLimit: async () => true },
    );
    expect(r.status).toBe(200);
    expect(created).toHaveLength(1);
    expect(created[0].ip).toBe("1.2.3.4");
  });
});
