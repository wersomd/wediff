import "server-only";
import { db } from "@/lib/db";
import type { DeliveryRepository } from "./delivery";
export const deliveryRepository: DeliveryRepository = {
 async prepare(day, payloads) {
  await db.$transaction(async tx => {
   // Serialize snapshot creation for a calendar day across cron processes.
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`reminders:${day}`}))::text`;
   if (await tx.reminderDelivery.count({ where: { day } })) return;
   if (payloads.length) await tx.reminderDelivery.createMany({ data: payloads.map((payload, part) => ({ day, part, payload })) });
  });
 },
 async claim(day, now) {
  await db.reminderDelivery.updateMany({ where: { status: "sending", leaseUntil: { lt: now } }, data: { status: "unknown", errorCode: "WORKER_INTERRUPTED", leaseUntil: null } });
  const where = { day, status: { in: ["pending", "failed"] }, attempts: { lt: 3 }, OR: [{ notBefore: null }, { notBefore: { lte: now } }] };
  const candidate = await db.reminderDelivery.findFirst({ where, orderBy: { part: "asc" } });
  if (!candidate) return null;
  const claimed = await db.reminderDelivery.updateMany({ where: { ...where, id: candidate.id }, data: { status: "sending", attempts: { increment: 1 }, leaseUntil: new Date(now.getTime() + 120_000) } });
  return claimed.count === 1 ? { id: candidate.id, payload: candidate.payload } : null;
 },
 async finish(id, result, now) {
  await db.reminderDelivery.updateMany({ where: { id, status: "sending" }, data: {
   status: result.status, errorCode: result.errorCode ?? null, leaseUntil: null,
   sentAt: result.status === "sent" ? now : null,
   notBefore: result.status === "failed" ? new Date(now.getTime() + (result.retryAfter ?? 60) * 1000) : null,
  } });
 },
};
