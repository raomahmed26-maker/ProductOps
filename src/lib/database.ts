/**
 * Connection strings.
 *
 * Local: defaults to Postgres on this machine.
 * Vercel: DATABASE_URL is required. For Supabase, use the transaction pooler
 * (port 6543) as DATABASE_URL and the session/direct URL (port 5432) as
 * DIRECT_URL so migrations can run.
 */
const LOCAL_DEFAULT =
  "postgresql://productops:productops_local_dev@127.0.0.1:5432/product_ops";

function trim(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

export function isSupabaseUrl(url: string): boolean {
  return /supabase\.(co|com)/i.test(url);
}

function withQueryParam(url: string, key: string, value: string): string {
  if (url.includes(`${key}=`)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${key}=${value}`;
}

/** Runtime URL: pooled connection, TLS on hosted Postgres. */
export function asRuntimeUrl(url: string): string {
  let next = url;
  if (isSupabaseUrl(next) || Boolean(process.env.VERCEL)) {
    next = withQueryParam(next, "sslmode", "require");
  }
  return next;
}

/**
 * Migrations cannot use Supabase's transaction pooler (port 6543). The same
 * hostname on 5432 is session mode and works from Vercel (IPv4).
 */
export function asMigrateUrl(url: string): string {
  let next = url.replace(/:6543\b/, ":5432");
  if (isSupabaseUrl(next) || Boolean(process.env.VERCEL)) {
    next = withQueryParam(next, "sslmode", "require");
  }
  return next;
}

export function resolveDatabaseUrl(): string | undefined {
  const url = trim(process.env.DATABASE_URL) || trim(process.env.DIRECT_URL);
  if (url) return asRuntimeUrl(url);
  if (process.env.VERCEL) return undefined;
  return LOCAL_DEFAULT;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(trim(process.env.DATABASE_URL) || trim(process.env.DIRECT_URL) || !process.env.VERCEL);
}

/** URL used by `prisma migrate` — prefer the direct / session (non-pooled) connection. */
export function resolveMigrateUrl(): string {
  const url = trim(process.env.DIRECT_URL) || trim(process.env.DATABASE_URL) || LOCAL_DEFAULT;
  return asMigrateUrl(url);
}

export function needsSsl(url: string): boolean {
  if (/localhost|127\.0\.0\.1/.test(url)) return false;
  return isSupabaseUrl(url) || Boolean(process.env.VERCEL) || /sslmode=require/i.test(url);
}
