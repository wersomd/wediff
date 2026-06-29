import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  Target,
  Repeat,
  NotebookPen,
  HeartPulse,
  Wallet,
  HandCoins,
  CreditCard,
  StickyNote,
  Bookmark,
  Sparkles,
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
  { title: "Повестка", href: "/agenda", icon: CalendarDays },
  { title: "Задачи", href: "/tasks", icon: CheckSquare },
  { title: "Проекты", href: "/projects", icon: FolderKanban },
  { title: "Цели", href: "/goals", icon: Target },
  { title: "Привычки", href: "/habits", icon: Repeat },
  { title: "Дневник", href: "/journal", icon: NotebookPen },
  { title: "Здоровье", href: "/health", icon: HeartPulse },
  { title: "Финансы", href: "/finances", icon: Wallet },
  { title: "Долги", href: "/debts", icon: HandCoins },
  { title: "Подписки", href: "/subscriptions", icon: CreditCard },
  { title: "Заметки", href: "/notes", icon: StickyNote },
  { title: "Ссылки", href: "/links", icon: Bookmark },
  { title: "Хочу", href: "/wishlist", icon: Sparkles },
  { title: "Файлы", href: "/files", icon: Files },
];

export const footerNav: NavItem[] = [
  { title: "Настройки", href: "/settings", icon: Settings },
];
