/**
 * Vercel runs `vercel-build` instead of `build` when it exists.
 *
 * DATABASE_URL (Supabase transaction pooler, port 6543) is used at runtime.
 * DIRECT_URL (session pooler or direct, port 5432) is used for migrations.
 * If only the 6543 URL is set, this rewrites it to 5432 on the same host.
 */
import { spawnSync } from "node:child_process";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function migrateUrl() {
  const raw = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();
  return raw.replace(/:6543\b/, ":5432");
}

run("npx", ["prisma", "generate"]);

const runtimeUrl = (process.env.DATABASE_URL || process.env.DIRECT_URL || "").trim();

if (runtimeUrl) {
  const direct = migrateUrl();
  const migrateEnv = {
    ...process.env,
    DATABASE_URL: direct,
    DIRECT_URL: process.env.DIRECT_URL || direct,
  };
  run("npx", ["prisma", "migrate", "deploy"], migrateEnv);
  run("npx", ["tsx", "prisma/seed.ts", "--if-empty"], {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || runtimeUrl,
  });
} else {
  console.warn(
    "DATABASE_URL is not set — skipping migrate/seed. Add the Supabase URIs in Vercel env and redeploy.",
  );
}

run("npx", ["next", "build"]);
