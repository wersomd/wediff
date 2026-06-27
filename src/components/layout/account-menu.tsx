"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/features/auth/actions";

export function AccountMenu({
  user,
}: {
  user: { email?: string | null; name?: string | null };
}) {
  const [pending, startTransition] = useTransition();
  const label = user.name || user.email || "Account";
  const initial = (user.name || user.email || "W").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8">
          <AvatarFallback className="bg-muted text-xs font-medium">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          className="cursor-pointer"
          // Run the server action from onSelect: a nested <form> inside a
          // DropdownMenuItem never submits because Radix unmounts the menu
          // (and the form) before the native submit fires.
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => logout());
          }}
        >
          <LogOut className="size-4" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
