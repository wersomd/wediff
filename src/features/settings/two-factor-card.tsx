"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  startTwoFactorSetup,
  confirmTwoFactor,
  disableTwoFactor,
} from "./actions";

export function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(
    null,
  );
  const [code, setCode] = useState("");

  function begin() {
    start(async () => {
      setSetup(await startTwoFactorSetup());
    });
  }

  function confirm() {
    start(async () => {
      const res = await confirmTwoFactor(code);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Двухфакторная аутентификация включена");
      setSetup(null);
      setCode("");
      router.refresh();
    });
  }

  function disable() {
    start(async () => {
      await disableTwoFactor();
      toast.success("Двухфакторная аутентификация отключена");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <CardTitle className="text-base">Двухфакторная аутентификация</CardTitle>
        </div>
        <CardDescription>
          {enabled
            ? "Включена. При входе потребуется код из приложения-аутентификатора."
            : "Добавьте второй фактор: код из Google Authenticator, 1Password и т.п."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          <Button variant="destructive" onClick={disable} disabled={pending}>
            Отключить 2FA
          </Button>
        ) : setup ? (
          <div className="space-y-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setup.qr}
                alt="QR-код для настройки 2FA"
                className="size-40 rounded-lg border border-border bg-white p-2"
              />
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Отсканируйте QR в приложении-аутентификаторе или введите ключ
                  вручную:
                </p>
                <code className="block break-all rounded-md bg-muted px-2 py-1 font-mono text-xs">
                  {setup.secret}
                </code>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-2">
                <label htmlFor="totp" className="text-sm font-medium">
                  Код из приложения
                </label>
                <Input
                  id="totp"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  placeholder="123456"
                  className="w-40"
                />
              </div>
              <Button onClick={confirm} disabled={pending || code.length < 6}>
                Подтвердить
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={begin} disabled={pending}>
            Включить 2FA
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
