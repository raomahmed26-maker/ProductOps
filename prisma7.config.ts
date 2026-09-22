import "dotenv/config";
import { defineConfig } from "prisma/config";

const LOCAL_DEFAULT =
  "postgresql://productops:productops_local_dev@127.0.0.1:5432/product_ops";

function migrateUrl(): string {
  const raw =
    process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || LOCAL_DEFAULT;
  // Supabase transaction pooler (6543) cannot run migrations.
  return raw.replace(/:6543\b/, ":5432");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: migrateUrl(),
  },
});
