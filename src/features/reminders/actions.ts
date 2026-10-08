"use server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { reminderSettingsSchema } from "./schema";
export async function saveReminderSettings(input: unknown) {
 const session = await auth();
 if (!session?.user?.id) return { error: "Нужен вход в аккаунт" };
 const result = reminderSettingsSchema.safeParse(input);
 if (!result.success) return { error: "Проверьте настройки" };
 try {
  await db.$transaction(async tx => {
   await tx.setting.upsert({ where: { key: "reminders" }, create: { key: "reminders", value: result.data }, update: { value: result.data } });
   // Do not deliver an old queued snapshot after category preferences change.
   await tx.reminderDelivery.updateMany({ where: { status: { in: ["pending", "failed"] } }, data: { status: "cancelled", errorCode: null } });
  });
  revalidatePath("/settings");
  return { ok: true as const };
 } catch { return { error: "Не удалось сохранить. Проверьте подключение к базе и миграцию уведомлений." }; }
}
