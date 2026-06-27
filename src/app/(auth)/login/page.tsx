import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex items-center gap-2">
            <span className="size-6 rounded-md bg-primary" />
            <span className="text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">С возвращением</CardTitle>
            <CardDescription>Войдите в свой Life OS</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
