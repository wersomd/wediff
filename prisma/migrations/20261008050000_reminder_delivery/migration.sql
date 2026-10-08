CREATE TABLE "ReminderDelivery" (
  "id" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "part" INTEGER NOT NULL,
  "payload" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "leaseUntil" TIMESTAMP(3),
  "notBefore" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReminderDelivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReminderDelivery_status_check" CHECK ("status" IN ('pending', 'sending', 'sent', 'failed', 'unknown', 'cancelled'))
);
CREATE UNIQUE INDEX "ReminderDelivery_day_part_key" ON "ReminderDelivery"("day", "part");
CREATE INDEX "ReminderDelivery_day_status_idx" ON "ReminderDelivery"("day", "status");
ALTER TABLE "ReminderDelivery" ENABLE ROW LEVEL SECURITY;
