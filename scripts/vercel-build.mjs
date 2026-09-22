/**
 * Vercel runs `vercel-build` instead of `build` when it exists.
 *
 * Without DATABASE_URL, skip migrate/seed so `next build` can finish — the app
 * then renders a setup screen. Once the URL is set, this applies migrations
 * and loads the sample portfolio if the database is empty.
 */
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "generate"]);

if (process.env.DATABASE_URL) {
  run("npx", ["prisma", "migrate", "deploy"]);
  run("npx", ["tsx", "prisma/seed.ts", "--if-empty"]);
} else {
  console.warn(
    "DATABASE_URL is not set — skipping migrate/seed. Add a Postgres URL in Vercel env and redeploy.",
  );
}

run("npx", ["next", "build"]);
