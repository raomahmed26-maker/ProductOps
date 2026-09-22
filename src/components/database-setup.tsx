import { ButtonLink } from "@/components/ui/button-link";

export function DatabaseSetup() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-lg place-items-center px-6 py-12 text-center">
      <div>
        <p className="font-mono text-xs text-muted-foreground">Supabase</p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight">Connect the database</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an empty Supabase project. Do not add tables — the next Vercel deploy creates
          them. Then paste the two connection URIs into Vercel.
        </p>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-left text-sm text-muted-foreground">
          <li>
            Open{" "}
            <a className="font-medium text-foreground underline" href="https://supabase.com/dashboard">
              supabase.com/dashboard
            </a>
            , New project. Wait until it is healthy.
          </li>
          <li>
            Project Settings → Database → Connect. Method: URI.
            <ul className="mt-2 space-y-1 pl-4">
              <li>
                Type <span className="font-medium text-foreground">Transaction</span> (port 6543) →
                copy into Vercel as{" "}
                <code className="rounded bg-muted px-1 font-mono text-[11px]">DATABASE_URL</code>
              </li>
              <li>
                Type <span className="font-medium text-foreground">Session</span> (port 5432) → copy
                into Vercel as{" "}
                <code className="rounded bg-muted px-1 font-mono text-[11px]">DIRECT_URL</code>
              </li>
            </ul>
          </li>
          <li>
            Vercel → this project → Settings → Environment Variables. Add both, for Production,
            Preview and Development. Then Redeploy.
          </li>
        </ol>
        <p className="mt-5 text-left text-xs text-muted-foreground">
          Replace <code className="rounded bg-muted px-1 font-mono">[YOUR-PASSWORD]</code> in the
          URI with the database password you set at project creation. Leave the Table Editor empty.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a
            href="https://supabase.com/dashboard"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Open Supabase
          </a>
          <ButtonLink href="/guide" variant="outline" size="sm">
            Owner’s guide
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
