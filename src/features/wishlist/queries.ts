import "server-only";
import { db } from "@/lib/db";

// Wishlist items, newest first. Price decimal → number.
export async function getWishItems() {
  const rows = await db.wishItem.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((w) => ({
    id: w.id,
    title: w.title,
    type: w.type,
    status: w.status,
    url: w.url,
    note: w.note,
    rating: w.rating,
    price: w.price ? w.price.toNumber() : null,
    currency: w.currency,
  }));
}

export type WishRow = Awaited<ReturnType<typeof getWishItems>>[number];
