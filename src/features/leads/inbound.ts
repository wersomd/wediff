import { leadInboundSchema } from "./schema";
import { isOriginAllowed } from "./cors";

export type LeadPayload = {
  name: string;
  contact: string;
  message: string;
  source: string;
  ip?: string;
};

export type InboundDeps = {
  createLead: (data: LeadPayload) => Promise<void>;
  notify: (lead: LeadPayload) => Promise<void>;
  // Возвращает true, если запрос в пределах лимита. Опционально (тесты/дев).
  checkRateLimit?: (ip: string | null) => Promise<boolean>;
};

export type InboundResult = {
  status: number;
  body: { ok: true } | { error: string };
};

// Минимальное время заполнения формы человеком (мс). Быстрее — бот.
const MIN_FILL_MS = Number(process.env.LEADS_MIN_FILL_MS ?? 2000);

export async function handleInboundLead(
  rawBody: unknown,
  ctx: { origin: string | null; token: string | null; ip?: string | null },
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

  const { name, contact, message, source, website, elapsed } = parsed.data;

  // Honeypot: боты заполняют скрытое поле. Отвечаем «успех», но не пишем в БД.
  if (website.trim() !== "") {
    return { status: 200, body: { ok: true } };
  }

  // Тайминг-ловушка: форма заполнена подозрительно быстро → бот.
  // Отсутствие/мусор elapsed (undefined) не блокируем (кэш, старый JS).
  if (typeof elapsed === "number" && elapsed >= 0 && elapsed < MIN_FILL_MS) {
    return { status: 200, body: { ok: true } };
  }

  // Rate-limit по IP (если подключён). Превышение → 429.
  if (deps.checkRateLimit) {
    const allowed = await deps.checkRateLimit(ctx.ip ?? null);
    if (!allowed) {
      return { status: 429, body: { error: "Слишком много запросов. Попробуйте позже." } };
    }
  }

  const lead: LeadPayload = { name, contact, message, source };
  if (ctx.ip) lead.ip = ctx.ip;
  await deps.createLead(lead);
  // Уведомление — best-effort, ошибки не должны ронять приём.
  await deps.notify(lead).catch(() => {});

  return { status: 200, body: { ok: true } };
}
