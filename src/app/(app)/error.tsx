"use client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  return <div className="workspace-panel mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center">
    <AlertCircle className="mb-4 size-9 text-destructive" />
    <h1 className="text-xl font-semibold">Не удалось загрузить раздел</h1>
    <p className="mb-6 mt-2 text-sm text-muted-foreground">Проверьте соединение и попробуйте ещё раз. Данные не изменены.</p>
    <Button onClick={reset}>Попробовать снова</Button>
  </div>;
}
