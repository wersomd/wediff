import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { verifyTotp } from "@/lib/totp";
import { loginSchema } from "@/features/auth/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        code: {},
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password, code } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        if (user.twoFactorEnabled) {
          if (!code || !user.twoFactorSecret) return null;
          if (!verifyTotp(code, user.twoFactorSecret)) return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
