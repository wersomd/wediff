import { WishStatus, WishType } from "@prisma/client";

export const WISH_TYPE_LABELS: Record<WishType, string> = {
  BOOK: "Книга",
  MOVIE: "Фильм",
  SHOW: "Сериал",
  PURCHASE: "Покупка",
  PLACE: "Место",
  OTHER: "Другое",
};

export const WISH_TYPE_ICONS: Record<WishType, string> = {
  BOOK: "📖",
  MOVIE: "🎬",
  SHOW: "📺",
  PURCHASE: "🛍️",
  PLACE: "📍",
  OTHER: "✨",
};

export const WISH_TYPE_ORDER: WishType[] = [
  WishType.BOOK,
  WishType.MOVIE,
  WishType.SHOW,
  WishType.PURCHASE,
  WishType.PLACE,
  WishType.OTHER,
];

export const WISH_STATUS_LABELS: Record<WishStatus, string> = {
  WANT: "Хочу",
  IN_PROGRESS: "В процессе",
  DONE: "Готово",
};

export const WISH_STATUS_ORDER: WishStatus[] = [
  WishStatus.WANT,
  WishStatus.IN_PROGRESS,
  WishStatus.DONE,
];
