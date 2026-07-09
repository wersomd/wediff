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
