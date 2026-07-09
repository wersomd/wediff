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
