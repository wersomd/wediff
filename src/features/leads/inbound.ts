import { leadInboundSchema } from "./schema";
import { isOriginAllowed } from "./cors";

export type LeadPayload = {
  name: string;
  contact: string;
  message: string;
  source: string;
};

export type InboundDeps = {
  createLead: (data: LeadPayload) => Promise<void>;
  notify: (lead: LeadPayload) => Promise<void>;
};

export type InboundResult = {
  status: number;
  body: { ok: true } | { error: string };
};

export async function handleInboundLead(
  rawBody: unknown,
  ctx: { origin: string | null; token: string | null },
  deps: InboundDeps,
): Promise<InboundResult> {
  if (!isOriginAllowed(ctx.origin)) {
    return { status: 403, body: { error: "Forbidden origin" } };
  }

  const expectedToken = process.env.LEADS_INBOUND_TOKEN;
  if (expectedToken && ctx.token !== expectedToken) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const parsed = leadInboundSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      status: 400,
      body: { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
    };
  }

  const { name, contact, message, source, website } = parsed.data;

  // Honeypot: боты заполняют скрытое поле. Отвечаем «успех», но не пишем в БД.
  if (website.trim() !== "") {
    return { status: 200, body: { ok: true } };
  }

  const lead: LeadPayload = { name, contact, message, source };
  await deps.createLead(lead);
  // Уведомление — best-effort, ошибки не должны ронять приём.
  await deps.notify(lead).catch(() => {});

  return { status: 200, body: { ok: true } };
}
