import { auth } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Suspense } from "react";
import JarvisBar from "@/features/jarvis/components/jarvis-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = {
    email: session?.user?.email,
    name: session?.user?.name,
  };

  return (
    <WorkspaceShell user={user}>
      <Suspense fallback={<div className="p-8 text-muted-foreground">Загрузка пространства…</div>}>{children}</Suspense>
      <JarvisBar />
    </WorkspaceShell>
  );
}
