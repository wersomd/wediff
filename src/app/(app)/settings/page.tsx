import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { TwoFactorCard } from "@/features/settings/two-factor-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await db.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <>
      <PageHeader title="Settings" description="Аккаунт, безопасность и настройки приложения." />
      <div className="grid max-w-2xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Аккаунт</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Вы вошли как{" "}
            <span className="font-medium text-foreground">
              {user?.email ?? "—"}
            </span>
            .
          </CardContent>
        </Card>

        <TwoFactorCard enabled={user?.twoFactorEnabled ?? false} />
      </div>
    </>
  );
}
