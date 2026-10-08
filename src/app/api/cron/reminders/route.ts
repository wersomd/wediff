import { isCronAuthorized } from "@/features/reminders/authorization";
import { runDailyReminders } from "@/features/reminders/run";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
 if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) return Response.json({ error: "Unauthorized" }, { status: 401 });
 try {
  const result = await runDailyReminders();
  return Response.json(result, { status: result.failed || result.remaining ? 503 : 200, headers: { "Cache-Control": "no-store" } });
 } catch {
  return Response.json({ error: "REMINDERS_UNAVAILABLE" }, { status: 503 });
 }
}
