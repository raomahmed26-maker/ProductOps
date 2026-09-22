"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
      <div className="text-center">
        <AlertTriangle className="mx-auto size-6 text-amber-500" />
        <h1 className="mt-3 text-lg font-semibold tracking-tight">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "The page could not be rendered."}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Locally, run <code className="rounded bg-muted px-1.5 py-0.5 font-mono">npm run setup</code>.
          On Vercel, set the two Supabase URIs (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">DATABASE_URL</code> and{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">DIRECT_URL</code>) and redeploy.
        </p>
        <Button className="mt-5" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
