import { ButtonLink } from "@/components/ui/button-link";

export function DatabaseSetup() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-lg place-items-center px-6 text-center">
      <div>
        <p className="font-mono text-xs text-muted-foreground">Vercel</p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight">Postgres is not connected</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This build has no <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">DATABASE_URL</code>.
          Serverless hosts cannot keep a SQLite file, so the workspace needs a Postgres database
          (Neon, Supabase, or Vercel Postgres).
        </p>
        <ol className="mt-5 space-y-2 text-left text-sm text-muted-foreground">
          <li>
            1. Create a free Postgres database and copy the connection string. Use the{" "}
            <strong className="font-medium text-foreground">pooled</strong> URL if the host offers one.
          </li>
          <li>
            2. In Vercel → this project → Settings → Environment Variables, add{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">DATABASE_URL</code>.
            If you use Supabase’s pooler, also add{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">DIRECT_URL</code>{" "}
            with the direct (port 5432) URL so migrations can run.
          </li>
          <li>3. Redeploy. The next build will create tables and load the sample portfolio.</li>
        </ol>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a
            href="https://vercel.com/docs/storage/vercel-postgres"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Vercel Postgres
          </a>
          <ButtonLink href="/guide" variant="outline" size="sm">
            Owner’s guide
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
