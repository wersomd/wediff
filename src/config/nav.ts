import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  Inbox,
  Target,
  Repeat,
  Wallet,
  HandCoins,
  CreditCard,
  StickyNote,
  Bookmark,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { title: "Главная", href: "/dashboard", icon: LayoutDashboard },
  { title: "Повестка", href: "/agenda", icon: CalendarDays },
  { title: "Задачи", href: "/tasks", icon: CheckSquare },
  { title: "Проекты", href: "/projects", icon: FolderKanban },
  { title: "Заявки", href: "/leads", icon: Inbox },
  { title: "Цели", href: "/goals", icon: Target },
  { title: "Привычки", href: "/habits", icon: Repeat },
  { title: "Финансы", href: "/finances", icon: Wallet },
  { title: "Долги", href: "/debts", icon: HandCoins },
  { title: "Подписки", href: "/subscriptions", icon: CreditCard },
  { title: "Заметки", href: "/notes", icon: StickyNote },
  { title: "Ссылки", href: "/links", icon: Bookmark },
  { title: "Хочу", href: "/wishlist", icon: Sparkles },
];

export const footerNav: NavItem[] = [
  { title: "Настройки", href: "/settings", icon: Settings },
];
