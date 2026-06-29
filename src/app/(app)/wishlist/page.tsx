import type { Metadata } from "next";
import { WishlistView } from "@/features/wishlist/components/wishlist-view";
import { getWishItems } from "@/features/wishlist/queries";

export const metadata: Metadata = { title: "Хочу" };

export default async function WishlistPage() {
  const items = await getWishItems();
  return <WishlistView items={items} />;
}
