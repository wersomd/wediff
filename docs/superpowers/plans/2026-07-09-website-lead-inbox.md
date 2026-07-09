# Website Lead Inbox — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заявки с лендинга `wersomd.github.io` падают в приложение wediff (Supabase) и присылают Telegram-пинг; пользователь видит их в инбоксе `/leads`.

**Architecture:** Публичный роут `POST /api/leads` в wediff (Next.js) принимает JSON от статичного сайта (CORS + honeypot), пишет `Lead` в Postgres через Prisma и шлёт fire-and-forget уведомление в Telegram. Приватная страница `/leads` показывает заявки. Форма сайта переключается с заглушки Formspree на этот endpoint, сохраняя WhatsApp-fallback.

**Tech Stack:** Next.js 15 (App Router), Prisma + Supabase Postgres, NextAuth (single-user), zod, shadcn/ui, sonner; vitest (только для чистой логики приёма). Пакетный менеджер — `pnpm`.

## Global Constraints

- Репозиторий бэкенда: `/Users/wersomd/dev/wediff`. Репозиторий формы: `/Users/wersomd/dev/wersomd.github.io`.
- Пакетный менеджер — **pnpm** (не npm/yarn).
- wediff — **single-user**: доменные таблицы НЕ несут `userId` (конвенция из `prisma/schema.prisma`). `Lead` тоже без `userId`.
- Публичный URL wediff: `https://wediff.vercel.app`. Endpoint приёма: `https://wediff.vercel.app/api/leads`.
- Разрешённый origin по умолчанию: `https://wersomd.github.io`.
- В wediff нет тест-раннера. Автотесты (vitest) добавляем ТОЛЬКО для чистых модулей приёма (schema/cors/inbound/notify). Роут, actions, UI проверяем через `pnpm lint`, `pnpm build`, `curl`-смоук и ручную проверку.
- Auth-паттерн server actions копируется из `src/features/notes/actions.ts` (`requireAuth()` через `auth()` из `@/lib/auth`).
- Prisma-клиент — `db` из `@/lib/db`.
- Статусы лида (значения строго): `NEW`, `CONTACTED`, `ARCHIVED`.

---

## Repo A — wediff (`/Users/wersomd/dev/wediff`)

### Task 1: Модель `Lead` в Prisma + миграция

**Files:**
- Modify: `prisma/schema.prisma` (добавить enum + модель в конец файла)

**Interfaces:**
- Produces: Prisma-модель `Lead { id, name, contact, message, source, status, createdAt }`, enum `LeadStatus { NEW, CONTACTED, ARCHIVED }`; сгенерированный `db.lead.*`.

- [ ] **Step 1: Добавить enum и модель в `prisma/schema.prisma`** (в конец файла)

```prisma
enum LeadStatus {
  NEW
  CONTACTED
  ARCHIVED
}

// Заявки, поступающие с внешних сайтов (лендинг wersomd.github.io и т.п.).
model Lead {
  id        String     @id @default(cuid())
  name      String
  contact   String // телефон / мессенджер / email — как ввёл клиент
  message   String     @default("")
  source    String     @default("wersomd.github.io")
  status    LeadStatus @default(NEW)
  createdAt DateTime   @default(now())

  @@index([status])
  @@index([createdAt])
}
```

- [ ] **Step 2: Проверить валидность схемы**

Run: `cd /Users/wersomd/dev/wediff && pnpm prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 3: Создать и применить миграцию к БД**

Run: `cd /Users/wersomd/dev/wediff && pnpm prisma migrate dev --name add_leads`
Expected: создаётся `prisma/migrations/<timestamp>_add_leads/migration.sql`, миграция применяется, клиент перегенерирован (`✔ Generated Prisma Client`).

- [ ] **Step 4: Убедиться, что типы собираются**

Run: `cd /Users/wersomd/dev/wediff && pnpm prisma generate && pnpm build`
Expected: build проходит без ошибок типов (`Lead` доступен как `db.lead`).

- [ ] **Step 5: Commit**

```bash
cd /Users/wersomd/dev/wediff
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(leads): add Lead model and migration"
```

---

### Task 2: Vitest + zod-схема + CORS-хелперы (чистая логика, TDD)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (dev-dep `vitest`, скрипт `test`)
- Create: `src/features/leads/schema.ts`
- Create: `src/features/leads/cors.ts`
- Test: `src/features/leads/schema.test.ts`
- Test: `src/features/leads/cors.test.ts`

**Interfaces:**
- Produces:
  - `leadInboundSchema` (zod) → `{ name: string; contact: string; message: string; source: string; website: string }` после парсинга.
  - `leadStatusSchema = z.enum(["NEW","CONTACTED","ARCHIVED"])`.
  - `allowedOrigin(): string`
  - `isOriginAllowed(origin: string | null): boolean`
  - `corsHeaders(origin: string): Record<string,string>`

- [ ] **Step 1: Установить vitest**

Run: `cd /Users/wersomd/dev/wediff && pnpm add -D vitest`
Expected: `vitest` в `devDependencies`.

- [ ] **Step 2: Создать `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Добавить скрипт `test` в `package.json`**

В блок `"scripts"` добавить строку:

```json
    "test": "vitest run",
```

- [ ] **Step 4: Написать падающие тесты `src/features/leads/schema.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { leadInboundSchema, leadStatusSchema } from "./schema";

describe("leadInboundSchema", () => {
  it("парсит валидную заявку и проставляет дефолты", () => {
    const r = leadInboundSchema.safeParse({ name: " Иван ", contact: "+7700" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Иван");
      expect(r.data.message).toBe("");
      expect(r.data.source).toBe("wersomd.github.io");
      expect(r.data.website).toBe("");
    }
  });

  it("отклоняет пустое имя", () => {
    const r = leadInboundSchema.safeParse({ name: "", contact: "x" });
    expect(r.success).toBe(false);
  });

  it("отклоняет пустой контакт", () => {
    const r = leadInboundSchema.safeParse({ name: "Иван", contact: "" });
    expect(r.success).toBe(false);
  });
});

describe("leadStatusSchema", () => {
  it("принимает валидный статус", () => {
    expect(leadStatusSchema.safeParse("CONTACTED").success).toBe(true);
  });
  it("отклоняет мусор", () => {
    expect(leadStatusSchema.safeParse("SPAM").success).toBe(false);
  });
});
```

- [ ] **Step 5: Написать падающие тесты `src/features/leads/cors.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
```

- [ ] **Step 6: Запустить тесты — убедиться, что падают**

Run: `cd /Users/wersomd/dev/wediff && pnpm test`
Expected: FAIL (модули `./schema`, `./cors` ещё не существуют).

- [ ] **Step 7: Реализовать `src/features/leads/schema.ts`**

```ts
import { z } from "zod";

export const leadInboundSchema = z.object({
  name: z.string().trim().min(1, "Введите имя").max(120),
  contact: z.string().trim().min(1, "Введите контакт").max(160),
  message: z.string().trim().max(2000).optional().default(""),
  source: z.string().trim().max(120).optional().default("wersomd.github.io"),
  website: z.string().optional().default(""), // honeypot: люди оставляют пустым
});

export type LeadInboundInput = z.input<typeof leadInboundSchema>;
export type LeadInboundData = z.output<typeof leadInboundSchema>;

export const leadStatusSchema = z.enum(["NEW", "CONTACTED", "ARCHIVED"]);
```

- [ ] **Step 8: Реализовать `src/features/leads/cors.ts`**

```ts
const DEFAULT_ORIGIN = "https://wersomd.github.io";

export function allowedOrigin(): string {
  return process.env.LEADS_ALLOWED_ORIGIN || DEFAULT_ORIGIN;
}

export function isOriginAllowed(origin: string | null): boolean {
  const allowed = process.env.LEADS_ALLOWED_ORIGIN;
  if (!allowed) return true; // не сконфигурирован → пропускаем (dev)
  return origin === allowed;
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-lead-token",
    "Access-Control-Max-Age": "86400",
  };
}
```

- [ ] **Step 9: Запустить тесты — убедиться, что проходят**

Run: `cd /Users/wersomd/dev/wediff && pnpm test`
Expected: PASS (все тесты schema + cors зелёные).

- [ ] **Step 10: Commit**

```bash
cd /Users/wersomd/dev/wediff
git add vitest.config.ts package.json pnpm-lock.yaml src/features/leads/schema.ts src/features/leads/cors.ts src/features/leads/schema.test.ts src/features/leads/cors.test.ts
git commit -m "feat(leads): add zod schema, cors helpers, vitest setup"
```

---

### Task 3: Чистый обработчик приёма `handleInboundLead` (TDD)

**Files:**
- Create: `src/features/leads/inbound.ts`
- Test: `src/features/leads/inbound.test.ts`

**Interfaces:**
- Consumes: `leadInboundSchema` (Task 2), `isOriginAllowed` (Task 2).
- Produces:
  - `type LeadPayload = { name: string; contact: string; message: string; source: string }`
  - `type InboundDeps = { createLead: (data: LeadPayload) => Promise<void>; notify: (lead: LeadPayload) => Promise<void> }`
  - `type InboundResult = { status: number; body: { ok: true } | { error: string } }`
  - `handleInboundLead(rawBody: unknown, ctx: { origin: string | null; token: string | null }, deps: InboundDeps): Promise<InboundResult>`

- [ ] **Step 1: Написать падающие тесты `src/features/leads/inbound.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
});
```

- [ ] **Step 2: Запустить — убедиться, что падают**

Run: `cd /Users/wersomd/dev/wediff && pnpm test src/features/leads/inbound.test.ts`
Expected: FAIL (модуль `./inbound` не существует).

- [ ] **Step 3: Реализовать `src/features/leads/inbound.ts`**

```ts
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
```

- [ ] **Step 4: Запустить — убедиться, что проходят**

Run: `cd /Users/wersomd/dev/wediff && pnpm test src/features/leads/inbound.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/wersomd/dev/wediff
git add src/features/leads/inbound.ts src/features/leads/inbound.test.ts
git commit -m "feat(leads): add pure inbound lead handler"
```

---

### Task 4: Telegram-уведомление `notifyNewLead` (TDD)

**Files:**
- Create: `src/features/leads/notify.ts`
- Test: `src/features/leads/notify.test.ts`

**Interfaces:**
- Consumes: `LeadPayload` (Task 3).
- Produces: `notifyNewLead(lead: LeadPayload): Promise<void>` (никогда не бросает).

- [ ] **Step 1: Написать падающие тесты `src/features/leads/notify.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { notifyNewLead } from "./notify";

const LEAD = { name: "Иван", contact: "+7700", message: "сайт", source: "wersomd.github.io" };

describe("notifyNewLead", () => {
  const prevToken = process.env.TELEGRAM_BOT_TOKEN;
  const prevChat = process.env.TELEGRAM_CHAT_ID;
  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = prevToken;
    process.env.TELEGRAM_CHAT_ID = prevChat;
  });

  it("не зовёт fetch, если env не заданы", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await notifyNewLead(LEAD);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("зовёт Telegram API с chat_id и текстом", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "TESTTOKEN";
    process.env.TELEGRAM_CHAT_ID = "123";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await notifyNewLead(LEAD);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/botTESTTOKEN/sendMessage");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe("123");
    expect(body.text).toContain("Иван");
  });

  it("не бросает, если fetch падает", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "TESTTOKEN";
    process.env.TELEGRAM_CHAT_ID = "123";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net")));
    await expect(notifyNewLead(LEAD)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Запустить — убедиться, что падают**

Run: `cd /Users/wersomd/dev/wediff && pnpm test src/features/leads/notify.test.ts`
Expected: FAIL (модуль `./notify` не существует).

- [ ] **Step 3: Реализовать `src/features/leads/notify.ts`**

```ts
import type { LeadPayload } from "./inbound";

// Best-effort Telegram-уведомление о новой заявке. Никогда не бросает —
// приём лида не должен зависеть от доставки пинга.
export async function notifyNewLead(lead: LeadPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🟢 Новая заявка (${lead.source})\n` +
    `Имя: ${lead.name}\n` +
    `Контакт: ${lead.contact}\n` +
    `Задача: ${lead.message || "—"}`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // проглатываем — уведомление опционально
  }
}
```

- [ ] **Step 4: Запустить — убедиться, что проходят**

Run: `cd /Users/wersomd/dev/wediff && pnpm test src/features/leads/notify.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/wersomd/dev/wediff
git add src/features/leads/notify.ts src/features/leads/notify.test.ts
git commit -m "feat(leads): add best-effort Telegram notification"
```

---

### Task 5: Публичный роут `POST /api/leads` + смоук

**Files:**
- Create: `src/app/api/leads/route.ts`

**Interfaces:**
- Consumes: `handleInboundLead`, `LeadPayload` (Task 3); `notifyNewLead` (Task 4); `allowedOrigin`, `corsHeaders` (Task 2); `db` from `@/lib/db`.
- Produces: HTTP endpoint `POST /api/leads`, `OPTIONS /api/leads`.

- [ ] **Step 1: Реализовать `src/app/api/leads/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleInboundLead, type LeadPayload } from "@/features/leads/inbound";
import { notifyNewLead } from "@/features/leads/notify";
import { allowedOrigin, corsHeaders } from "@/features/leads/cors";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin()),
  });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(allowedOrigin());

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const result = await handleInboundLead(
    body,
    { origin: req.headers.get("origin"), token: req.headers.get("x-lead-token") },
    {
      createLead: async (data: LeadPayload) => {
        await db.lead.create({ data });
      },
      notify: notifyNewLead,
    },
  );

  return NextResponse.json(result.body, { status: result.status, headers });
}
```

- [ ] **Step 2: Собрать проект (проверка типов)**

Run: `cd /Users/wersomd/dev/wediff && pnpm build`
Expected: build успешен, роут `/api/leads` в выводе списка роутов.

- [ ] **Step 3: Смоук-тест против дев-сервера**

В одном терминале: `cd /Users/wersomd/dev/wediff && pnpm dev`
В другом:

```bash
curl -s -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","contact":"+7700 000 0000","message":"проверка"}'
```

Expected: `{"ok":true}`. Проверить: заявка появилась в БД (`pnpm prisma studio` → таблица `Lead`, одна запись со статусом `NEW`).

- [ ] **Step 4: Смоук honeypot (не должно создавать запись)**

```bash
curl -s -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Bot","contact":"x","website":"http://spam"}'
```

Expected: `{"ok":true}`, но новой записи в `Lead` НЕ появилось.

- [ ] **Step 5: Commit**

```bash
cd /Users/wersomd/dev/wediff
git add src/app/api/leads/route.ts
git commit -m "feat(leads): add public POST /api/leads route with CORS"
```

---

### Task 6: Queries + server actions

**Files:**
- Create: `src/features/leads/queries.ts`
- Create: `src/features/leads/actions.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db`; `auth` from `@/lib/auth`; `leadStatusSchema` (Task 2).
- Produces:
  - `getLeads(): Promise<LeadRow[]>`, `type LeadRow`
  - `setLeadStatus(id: string, status: unknown): Promise<{ ok: true } | { error: string }>`
  - `deleteLead(id: string): Promise<{ ok: true } | { error: string }>`

- [ ] **Step 1: Реализовать `src/features/leads/queries.ts`**

```ts
import "server-only";
import { db } from "@/lib/db";

// Заявки в инбоксе: новые сверху.
export async function getLeads() {
  return db.lead.findMany({ orderBy: { createdAt: "desc" } });
}

export type LeadRow = Awaited<ReturnType<typeof getLeads>>[number];
```

- [ ] **Step 2: Реализовать `src/features/leads/actions.ts`** (паттерн auth из `features/notes/actions.ts`)

```ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadStatusSchema } from "./schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

export async function setLeadStatus(id: string, status: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = leadStatusSchema.safeParse(status);
  if (!parsed.success) return { error: "Неверный статус" };
  await db.lead.update({ where: { id }, data: { status: parsed.data } });
  revalidatePath("/leads");
  return { ok: true };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  await requireAuth();
  await db.lead.delete({ where: { id } });
  revalidatePath("/leads");
  return { ok: true };
}
```

- [ ] **Step 3: Собрать проект**

Run: `cd /Users/wersomd/dev/wediff && pnpm build`
Expected: build успешен.

- [ ] **Step 4: Commit**

```bash
cd /Users/wersomd/dev/wediff
git add src/features/leads/queries.ts src/features/leads/actions.ts
git commit -m "feat(leads): add queries and status/delete server actions"
```

---

### Task 7: Инбокс-страница `/leads` + компонент + пункт меню

**Files:**
- Create: `src/features/leads/components/leads-view.tsx`
- Create: `src/app/(app)/leads/page.tsx`
- Modify: `src/config/nav.ts`

**Interfaces:**
- Consumes: `getLeads`, `LeadRow` (Task 6); `setLeadStatus`, `deleteLead` (Task 6); shadcn ui (`button`, `badge`, `card`, `select`), `toast` (sonner), `PageHeader`/`EmptyState` из `@/components/shared/*`.
- Produces: страница `/leads`, компонент `LeadsView`.

- [ ] **Step 1: Реализовать `src/features/leads/components/leads-view.tsx`**

```tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Inbox, Check, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { setLeadStatus, deleteLead } from "../actions";
import type { LeadRow } from "../queries";

const ALL = "ALL";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Новая",
  CONTACTED: "В работе",
  ARCHIVED: "Архив",
};

function contactLinks(contact: string): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  const digits = contact.replace(/[^\d]/g, "");
  if (digits.length >= 10) {
    links.push({ href: `https://wa.me/${digits}`, label: "WhatsApp" });
    links.push({ href: `tel:+${digits}`, label: "Позвонить" });
  }
  const tg = contact.match(/@([A-Za-z0-9_]{3,})/);
  if (tg) links.push({ href: `https://t.me/${tg[1]}`, label: "Telegram" });
  return links;
}

export function LeadsView({ initialLeads }: { initialLeads: LeadRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [filter, setFilter] = useState<string>(ALL);

  const leads = useMemo(
    () => (filter === ALL ? initialLeads : initialLeads.filter((l) => l.status === filter)),
    [initialLeads, filter],
  );

  function refresh() {
    start(() => router.refresh());
  }

  async function onStatus(id: string, status: string) {
    const res = await setLeadStatus(id, status);
    if ("error" in res) return toast.error(res.error);
    toast.success("Обновлено");
    refresh();
  }

  async function onDelete(id: string) {
    const res = await deleteLead(id);
    if ("error" in res) return toast.error(res.error);
    toast.success("Удалено");
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Заявки" description="Заявки с сайта" icon={Inbox} />

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Все</SelectItem>
          <SelectItem value="NEW">Новые</SelectItem>
          <SelectItem value="CONTACTED">В работе</SelectItem>
          <SelectItem value="ARCHIVED">Архив</SelectItem>
        </SelectContent>
      </Select>

      {leads.length === 0 ? (
        <EmptyState icon={Inbox} title="Заявок пока нет" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {leads.map((lead) => (
            <Card key={lead.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{lead.name}</span>
                <Badge variant="secondary">{STATUS_LABEL[lead.status] ?? lead.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{lead.contact}</div>
              {lead.message ? <p className="text-sm">{lead.message}</p> : null}
              <div className="text-xs text-muted-foreground">
                {new Date(lead.createdAt).toLocaleString("ru-RU")} · {lead.source}
              </div>

              <div className="flex flex-wrap gap-2">
                {contactLinks(lead.contact).map((l) => (
                  <Button key={l.label} asChild size="sm" variant="outline">
                    <a href={l.href} target="_blank" rel="noopener">{l.label}</a>
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => onStatus(lead.id, "CONTACTED")}>
                  <Check className="mr-1 h-4 w-4" /> Связался
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onStatus(lead.id, "ARCHIVED")}>
                  <Archive className="mr-1 h-4 w-4" /> В архив
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(lead.id)}>
                  <Trash2 className="mr-1 h-4 w-4" /> Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

> Примечание: сверить пропсы `PageHeader` и `EmptyState` с их определениями в `src/components/shared/` — если сигнатуры отличаются, подогнать вызовы (напр. `icon`/`title`/`description`).

- [ ] **Step 2: Реализовать `src/app/(app)/leads/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getLeads } from "@/features/leads/queries";
import { LeadsView } from "@/features/leads/components/leads-view";

export const metadata: Metadata = { title: "Заявки" };

export default async function LeadsPage() {
  const leads = await getLeads();
  return <LeadsView initialLeads={leads} />;
}
```

- [ ] **Step 3: Добавить пункт меню в `src/config/nav.ts`**

В импорт из `lucide-react` добавить `Inbox`. В массив `mainNav` добавить (например, сразу после «Проекты»):

```ts
  { title: "Заявки", href: "/leads", icon: Inbox },
```

- [ ] **Step 4: Собрать и проверить вручную**

Run: `cd /Users/wersomd/dev/wediff && pnpm build`
Expected: build успешен.
Затем `pnpm dev`, открыть `http://localhost:3000/leads` (залогинившись): виден список с тестовой заявкой из Task 5; кнопки «Связался»/«В архив»/«Удалить» меняют статус; фильтр работает; пункт «Заявки» есть в меню.

- [ ] **Step 5: Commit**

```bash
cd /Users/wersomd/dev/wediff
git add "src/app/(app)/leads/page.tsx" src/features/leads/components/leads-view.tsx src/config/nav.ts
git commit -m "feat(leads): add inbox page, view component, nav entry"
```

---

### Task 8: Env-шаблон + чеклист деплоя (wediff)

**Files:**
- Modify: `.env.example`

**Interfaces:** —

- [ ] **Step 1: Дополнить `.env.example`**

Добавить в конец:

```
# Приём заявок с внешних сайтов
LEADS_ALLOWED_ORIGIN=https://wersomd.github.io
LEADS_INBOUND_TOKEN=            # опционально: базовый барьер (токен виден в клиентском JS)
# Telegram-уведомление о новой заявке
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

- [ ] **Step 2: Локальный `.env`** — прописать те же переменные реальными значениями (получить `TELEGRAM_BOT_TOKEN` у `@BotFather`; `TELEGRAM_CHAT_ID` — написать боту и вызвать `https://api.telegram.org/bot<token>/getUpdates`, взять `chat.id`).

- [ ] **Step 3: Vercel** — в Project Settings → Environment Variables (Production) добавить `LEADS_ALLOWED_ORIGIN`, `LEADS_INBOUND_TOKEN` (если используешь), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

- [ ] **Step 4: Применить миграцию к прод-БД и задеплоить**

Run (локально, против прод-БД, если `DATABASE_URL` в окружении указывает на Supabase-прод): `cd /Users/wersomd/dev/wediff && pnpm prisma migrate deploy`
Затем `git push` — Vercel соберёт и задеплоит (в `build` уже есть `prisma generate`).

- [ ] **Step 5: Прод-смоук**

```bash
curl -s -X POST https://wediff.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -H "Origin: https://wersomd.github.io" \
  -d '{"name":"Prod Test","contact":"+7700 000 0000","message":"smoke"}'
```

Expected: `{"ok":true}`, заявка видна на `https://wediff.vercel.app/leads`, пришёл Telegram-пинг.

- [ ] **Step 6: Commit**

```bash
cd /Users/wersomd/dev/wediff
git add .env.example
git commit -m "chore(leads): document lead-inbox env vars"
```

---

## Repo B — wersomd.github.io (`/Users/wersomd/dev/wersomd.github.io`)

### Task 9: Переключить форму на wediff + honeypot

**Files:**
- Modify: `index.html` (форма `#lead-form`; добавить honeypot; убрать заглушку `action`)
- Modify: `styles/main.css` (класс `.hp-field` — спрятать honeypot)
- Modify: `js/main.js` (`initForm`)

**Interfaces:**
- Consumes: endpoint `https://wediff.vercel.app/api/leads` (Task 5).

- [ ] **Step 1: В `index.html` добавить honeypot и убрать Formspree-заглушку**

Заменить открывающий тег формы:

```html
<form class="lead-form reveal" id="lead-form" novalidate>
```

Сразу после открытия `<form ...>` добавить honeypot-поле:

```html
                    <input type="text" name="website" tabindex="-1" autocomplete="off"
                        aria-hidden="true" class="hp-field">
```

(Удалить прежние `action="https://formspree.io/f/YOUR_FORM_ID" method="POST"` из тега формы и комментарий про Formspree над ней.)

- [ ] **Step 2: В `styles/main.css` спрятать honeypot** (добавить в конец файла)

```css
.hp-field {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
}
```

- [ ] **Step 3: В `js/main.js` переписать `initForm`**

Заменить тело функции `initForm` на:

```js
function initForm() {
    const form = document.getElementById("lead-form");
    const note = document.getElementById("form-note");
    if (!form || !note) return;

    const LEADS_ENDPOINT = "https://wediff.vercel.app/api/leads";
    const LEADS_TOKEN = ""; // опционально: должен совпадать с LEADS_INBOUND_TOKEN в wediff

    const setNote = (msg, ok) => {
        note.textContent = msg;
        note.className = "form-note " + (ok ? "ok" : "err");
    };

    const toWhatsApp = (name, contact, message) => {
        const text = encodeURIComponent(
            `Заявка с сайта\nИмя: ${name}\nКонтакт: ${contact}\nЗадача: ${message || "—"}`
        );
        window.open(`https://wa.me/77070171318?text=${text}`, "_blank", "noopener");
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const name = (data.get("name") || "").toString().trim();
        const contact = (data.get("contact") || "").toString().trim();
        const message = (data.get("message") || "").toString().trim();
        const website = (data.get("website") || "").toString();

        if (!name || !contact) {
            setNote("Заполните имя и контакт.", false);
            return;
        }

        try {
            setNote("Отправляем…", true);
            const res = await fetch(LEADS_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(LEADS_TOKEN ? { "x-lead-token": LEADS_TOKEN } : {}),
                },
                body: JSON.stringify({ name, contact, message, website, source: "wersomd.github.io" }),
            });
            if (res.ok) {
                setNote("Заявка отправлена. Скоро свяжемся!", true);
                form.reset();
            } else {
                setNote("Не удалось отправить — открываем WhatsApp.", false);
                toWhatsApp(name, contact, message);
            }
        } catch {
            setNote("Нет связи — открываем WhatsApp.", false);
            toWhatsApp(name, contact, message);
        }
    });
}
```

- [ ] **Step 4: Ручная проверка** (локально)

Открыть `index.html` (например `python3 -m http.server` в папке репо), заполнить форму, отправить.
Expected: при рабочем endpoint — «Заявка отправлена…», запись появляется на `https://wediff.vercel.app/leads` + Telegram-пинг. При недоступном endpoint — открывается WhatsApp с текстом заявки. Honeypot-поле визуально не видно.

- [ ] **Step 5: Commit**

```bash
cd /Users/wersomd/dev/wersomd.github.io
git add index.html styles/main.css js/main.js
git commit -m "feat: send lead form to wediff endpoint with WhatsApp fallback"
```

---

## Порядок выполнения

Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (все в wediff), затем Task 9 (wersomd.github.io).
Task 8 (деплой + env) должен быть выполнен ДО финальной проверки Task 9 в проде.

## Проверка покрытия спеки

- Модель `Lead` + миграция → Task 1.
- Публичный роут + CORS + honeypot + токен → Task 2 (cors/schema), Task 3 (handler), Task 5 (route).
- Telegram-уведомление → Task 4, подключение в Task 5.
- Feature-модуль (schema/queries/actions/components) → Tasks 2, 6, 7.
- Страница-инбокс `/leads` + меню → Task 7.
- Env-переменные + деплой + миграция прод → Task 8.
- Форма сайта (honeypot + POST + WhatsApp fallback) → Task 9.
- Обработка ошибок (400/403/500/honeypot/notify-fail) → покрыто тестами в Task 3 и fallback-логикой Task 9.
