import "dotenv/config";
import { defineConfig } from "prisma/config";

const LOCAL_DEFAULT =
  "postgresql://productops:productops_local_dev@127.0.0.1:5432/product_ops";

const databaseUrl =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || LOCAL_DEFAULT;

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
