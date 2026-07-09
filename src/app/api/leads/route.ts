import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleInboundLead, type LeadPayload } from "@/features/leads/inbound";
import { notifyNewLead } from "@/features/leads/notify";
import { checkRateLimit } from "@/features/leads/rate-limit";
import { allowedOrigin, corsHeaders } from "@/features/leads/cors";

// Prisma + node fetch (Telegram) require the Node.js runtime, not Edge.
export const runtime = "nodejs";

// Максимальный размер тела запроса (байт). Заявка — сотни байт; всё сверх — мусор.
const MAX_BODY_BYTES = 10_000;

// IP клиента за прокси Vercel.
function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin()),
  });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(allowedOrigin());

  // Требуем JSON — отсекает form-урл-энкод и прочий мусор.
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Unsupported Media Type" }, { status: 415, headers });
  }

  // Cap на размер тела до парсинга.
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413, headers });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  try {
    const result = await handleInboundLead(
      body,
      {
        origin: req.headers.get("origin"),
        token: req.headers.get("x-lead-token"),
        ip: clientIp(req),
      },
      {
        createLead: async (data: LeadPayload) => {
          await db.lead.create({ data });
        },
        notify: notifyNewLead,
        checkRateLimit,
      },
    );
    return NextResponse.json(result.body, { status: result.status, headers });
  } catch (err) {
    console.error("POST /api/leads failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers });
  }
}
