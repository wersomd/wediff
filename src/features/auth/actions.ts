"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { verifyTotp } from "@/lib/totp";
import { loginSchema } from "./schema";

export type LoginState = {
  error?: string;
  step?: "credentials" | "2fa";
};

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    code: formData.get("code") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "Проверьте email и пароль", step: "credentials" };
  }

  const { email, password, code } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Неверный email или пароль", step: "credentials" };
  }

  if (user.twoFactorEnabled) {
    if (!code) return { step: "2fa" };
    if (!user.twoFactorSecret || !verifyTotp(code, user.twoFactorSecret)) {
      return { error: "Неверный код 2FA", step: "2fa" };
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      code: code ?? "",
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return {
        error: "Не удалось войти",
        step: user.twoFactorEnabled ? "2fa" : "credentials",
      };
    }
    throw e;
  }

  redirect("/dashboard");
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
