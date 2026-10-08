import type { DeliveryResult } from "./types";
export interface DeliveryRepository {
 prepare(day: string, payloads: string[]): Promise<void>;
 claim(day: string, now: Date): Promise<{ id: string; payload: string } | null>;
 finish(id: string, result: DeliveryResult, now: Date): Promise<void>;
}
export function createDeliveryRunner({ repository, sendMessage }: { repository: DeliveryRepository; sendMessage: (text: string) => Promise<DeliveryResult> }) {
 return { async run(day: string, payloads: string[], now: Date) {
  await repository.prepare(day, payloads);
  const started = Date.now();
  let sent = 0;
  let failed = 0;
  // Leave time to persist the result of a final 15s network request.
  while (Date.now() - started < 35_000) {
   const at = new Date(now.getTime() + Date.now() - started);
   const row = await repository.claim(day, at);
   if (!row) break;
   const result = await sendMessage(row.payload);
   await repository.finish(row.id, result, at);
   if (result.status === "sent") sent++;
   else { failed++; break; }
  }
  return { sent, failed };
 } };
}
