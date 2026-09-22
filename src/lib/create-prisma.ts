import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { resolveDatabaseUrl } from "./database";

function createClient() {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. In Vercel: Settings → Environment Variables → add a Postgres URL, then redeploy.",
    );
  }

  const adapter = new PrismaPg({
    connectionString: url,
    max: process.env.VERCEL ? 1 : 10,
  });

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export function createPrismaClient(): PrismaClient {
  return getDb();
}

/**
 * Lazy so importing this module on Vercel during `next build` (no DATABASE_URL
 * yet) does not throw. The first query is what requires a live database.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getDb();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
