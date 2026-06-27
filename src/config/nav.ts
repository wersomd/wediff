import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Repeat,
  Wallet,
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
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Habits", href: "/habits", icon: Repeat },
  { title: "Finances", href: "/finances", icon: Wallet },
  { title: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { title: "Notes", href: "/notes", icon: StickyNote },
  { title: "Links", href: "/links", icon: Bookmark },
  { title: "Files", href: "/files", icon: Files },
];

export const footerNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];
