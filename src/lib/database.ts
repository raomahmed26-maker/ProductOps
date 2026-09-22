/**
 * Connection strings.
 *
 * Local: defaults to Postgres on this machine.
 * Vercel: DATABASE_URL is required. For Supabase, use the transaction pooler
 * (port 6543) as DATABASE_URL and the session/direct URL (port 5432) as
 * DIRECT_URL so migrations can run.
 *
 * node-pg currently treats sslmode=require as verify-full, which fails on
 * Supabase's certificate chain ("self-signed certificate in certificate chain").
 * The Prisma adapter therefore enables TLS with rejectUnauthorized: false and
 * strips sslmode from the URL so the query string cannot override it.
 */
import type { PoolConfig } from "pg";

const LOCAL_DEFAULT =
  "postgresql://productops:productops_local_dev@127.0.0.1:5432/product_ops";

function trim(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

export function isSupabaseUrl(url: string): boolean {
  return /supabase\.(co|com)/i.test(url);
}

function stripQueryParams(url: string, keys: string[]): string {
  const q = url.indexOf("?");
  if (q === -1) return url;
  const base = url.slice(0, q);
  const kept = url
    .slice(q + 1)
    .split("&")
    .filter((part) => {
      const key = part.split("=")[0];
      return key !== "" && !keys.includes(key);
    });
  return kept.length > 0 ? `${base}?${kept.join("&")}` : base;
}

export function needsSsl(url: string): boolean {
  if (/localhost|127\.0\.0\.1/.test(url)) return false;
  return isSupabaseUrl(url) || Boolean(process.env.VERCEL) || /sslmode=/i.test(url);
}

/** Config for `pg.Pool`. Never leave sslmode=require in the URL. */
export function forPgPool(url: string): PoolConfig {
  return {
    connectionString: stripQueryParams(url, ["sslmode", "uselibpqcompat", "sslrootcert"]),
    max: process.env.VERCEL ? 1 : 10,
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  };
}

/**
 * Migrations cannot use Supabase's transaction pooler (port 6543). The same
 * hostname on 5432 is session mode and works from Vercel (IPv4).
 */
export function asMigrateUrl(url: string): string {
  return url.replace(/:6543\b/, ":5432");
}

export function resolveDatabaseUrl(): string | undefined {
  const url = trim(process.env.DATABASE_URL) || trim(process.env.DIRECT_URL);
  if (url) return url;
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
