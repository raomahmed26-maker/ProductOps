import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Local-first by design: the database is a single SQLite file inside the repo,
// so the workspace runs with no external services and no credentials.
const databaseUrl =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "workspace.db")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
