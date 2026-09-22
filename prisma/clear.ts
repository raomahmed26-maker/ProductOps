/**
 * Wipes structured workspace data so you can start with your own portfolio.
 * Leaves the schema in place. Demo notes in the vault are files — pass --vault
 * to move them out of the way rather than delete them.
 *
 * Writes prisma/.workspace-cleared so `seed --if-empty` will not refill the
 * demo on the next environment boot.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "workspace.db")}`;

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });

const MARKER = path.join(process.cwd(), "prisma", ".workspace-cleared");
const NOTES_DIR = path.join(process.cwd(), "vault", "notes");
const ARCHIVE_DIR = path.join(process.cwd(), "vault", "archive", "demo");

async function main() {
  console.log("Clearing products, documents, metrics and experiments...");
  await db.experimentResult.deleteMany();
  await db.experiment.deleteMany();
  await db.weeklyMetric.deleteMany();
  await db.storeSubmission.deleteMany();
  await db.qACycle.deleteMany();
  await db.documentLink.deleteMany();
  await db.stage.deleteMany();
  await db.product.deleteMany();

  fs.writeFileSync(
    MARKER,
    `Cleared ${new Date().toISOString()}\nThis file stops npm run setup / seed --if-empty from restoring the demo portfolio.\nDelete it, or run npm run db:seed, if you want the sample data back.\n`,
  );

  if (process.argv.includes("--vault")) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    const notes = fs.existsSync(NOTES_DIR)
      ? fs.readdirSync(NOTES_DIR).filter((file) => file.endsWith(".md"))
      : [];
    for (const file of notes) {
      fs.renameSync(path.join(NOTES_DIR, file), path.join(ARCHIVE_DIR, file));
    }
    console.log(
      notes.length === 0
        ? "No vault notes to move."
        : `Moved ${notes.length} vault note${notes.length === 1 ? "" : "s"} to vault/archive/demo.`,
    );
  } else {
    console.log("Vault notes left in place. Pass --vault to archive them.");
  }

  console.log("Workspace is empty. Add a product at /products/new, or see GUIDE.md.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
