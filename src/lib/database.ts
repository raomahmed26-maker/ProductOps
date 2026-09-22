/**
 * Connection strings. Local runs default to the Postgres installed on this
 * machine. Vercel has no local database — DATABASE_URL must be set there, or
 * the app shows a setup screen instead of crashing the build.
 */
const LOCAL_DEFAULT =
  "postgresql://productops:productops_local_dev@127.0.0.1:5432/product_ops";

export function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim() || process.env.DIRECT_URL?.trim();
  if (url) return url;
  if (process.env.VERCEL) return undefined;
  return LOCAL_DEFAULT;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(resolveDatabaseUrl());
}

/** URL used by `prisma migrate` — prefer the direct (non-pooled) connection. */
export function resolveMigrateUrl(): string {
  return (
    process.env.DIRECT_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    LOCAL_DEFAULT
  );
}
