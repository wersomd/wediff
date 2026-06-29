"use server";

import { revalidatePath } from "next/cache";
import { WishStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wishCreateSchema, wishUpdateSchema } from "./schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

type ActionResult = { ok: true } | { error: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

function revalidateWishlist() {
  revalidatePath("/wishlist");
}

export async function createWish(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = wishCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { title, type, status, url, note, rating, price, currency } =
    parsed.data;
  await db.wishItem.create({
    data: {
      title,
      type,
      status,
      url: clean(url),
      note: clean(note),
      rating: rating ?? null,
      price: price ?? null,
      currency: price ? (currency ?? "KZT") : null,
    },
  });
  revalidateWishlist();
  return { ok: true };
}

export async function updateWish(input: unknown): Promise<ActionResult> {
  await requireAuth();
  const parsed = wishUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { id, title, type, status, url, note, rating, price, currency } =
    parsed.data;
  await db.wishItem.update({
    where: { id },
    data: {
      title,
      type,
      status,
      url: clean(url),
      note: clean(note),
      rating: rating ?? null,
      price: price ?? null,
      currency: price ? (currency ?? "KZT") : null,
    },
  });
  revalidateWishlist();
  return { ok: true };
}

export async function setWishStatus(
  id: string,
  status: WishStatus,
): Promise<ActionResult> {
  await requireAuth();
  await db.wishItem.update({ where: { id }, data: { status } });
  revalidateWishlist();
  return { ok: true };
}

export async function deleteWish(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!id) return { error: "Нет id" };
  await db.wishItem.delete({ where: { id } });
  revalidateWishlist();
  return { ok: true };
}
