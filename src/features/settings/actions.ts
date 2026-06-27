"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateTotpSecret,
  totpKeyUri,
  totpQrDataUrl,
  verifyTotp,
} from "@/lib/totp";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function startTwoFactorSetup() {
  const id = await requireUserId();
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  const secret = generateTotpSecret();
  await db.user.update({
    where: { id },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });
  const qr = await totpQrDataUrl(totpKeyUri(user.email, secret));
  return { secret, qr };
}

export async function confirmTwoFactor(code: string) {
  const id = await requireUserId();
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (!user.twoFactorSecret) return { error: "Сначала начните настройку" };
  if (!verifyTotp(code.trim(), user.twoFactorSecret)) {
    return { error: "Неверный код" };
  }
  await db.user.update({ where: { id }, data: { twoFactorEnabled: true } });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function disableTwoFactor() {
  const id = await requireUserId();
  await db.user.update({
    where: { id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}
