import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm text-muted-foreground">404 — page not found</p>
      <Link
        href="/dashboard"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
