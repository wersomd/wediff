import { db } from "@/lib/db";

// Rate-limit публичного приёма заявок по IP. Fixed-window счётчик в Postgres
// (Supabase) — атомарный INSERT ... ON CONFLICT DO UPDATE, чтобы работать на
// serverless без in-memory состояния.
const LIMIT = Number(process.env.LEADS_RATE_LIMIT ?? 5);
const WINDOW_S = Number(process.env.LEADS_RATE_WINDOW_S ?? 60);

// Ключ окна: один IP × один временной бакет. Чистая функция — тестируется.
export function rateLimitKey(ip: string, nowMs: number, windowS: number): string {
  const bucket = Math.floor(nowMs / (windowS * 1000));
  return `lead:${ip}:${bucket}`;
}

// true — в пределах лимита (пропускаем), false — превышение (429).
export async function checkRateLimit(ip: string | null): Promise<boolean> {
  // Нет IP — лимитировать не по чему; не блокируем (на Vercel IP почти всегда есть).
  if (!ip) return true;

  const now = Date.now();
  const key = rateLimitKey(ip, now, WINDOW_S);
  // Держим строку живой на 2 окна, потом её подчистит опортунистический prune.
  const expiresAt = new Date(now + WINDOW_S * 2000);

  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "expiresAt")
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimit"."count" + 1
      RETURNING "count";
    `;
    const count = Number(rows[0]?.count ?? 1);

    // Изредка чистим протухшие строки (дёшево, не блокирует приём).
    if (count === 1 && Math.random() < 0.1) {
      await db.$executeRaw`DELETE FROM "RateLimit" WHERE "expiresAt" < now();`.catch(() => {});
    }

    return count <= LIMIT;
  } catch {
    // Сбой лимитера не должен ронять приём заявки — пропускаем (fail-open).
    return true;
  }
}
