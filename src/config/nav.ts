import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Repeat,
  Wallet,
  HandCoins,
  CreditCard,
  StickyNote,
  Bookmark,
  Files,
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
  { title: "Задачи", href: "/tasks", icon: CheckSquare },
  { title: "Проекты", href: "/projects", icon: FolderKanban },
  { title: "Привычки", href: "/habits", icon: Repeat },
  { title: "Финансы", href: "/finances", icon: Wallet },
  { title: "Долги", href: "/debts", icon: HandCoins },
  { title: "Подписки", href: "/subscriptions", icon: CreditCard },
  { title: "Заметки", href: "/notes", icon: StickyNote },
  { title: "Ссылки", href: "/links", icon: Bookmark },
  { title: "Файлы", href: "/files", icon: Files },
];

export const footerNav: NavItem[] = [
  { title: "Настройки", href: "/settings", icon: Settings },
];
