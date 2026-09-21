import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import fg from "fast-glob";

/**
 * The brainstorm space is deliberately not in the database. Notes are plain
 * Markdown files with YAML frontmatter under /vault/notes, so the folder can be
 * opened directly in Obsidian and git is the version history.
 */
export const VAULT_DIR = path.join(process.cwd(), "vault");
export const NOTES_DIR = path.join(VAULT_DIR, "notes");

export type Note = {
  slug: string;
  title: string;
  tags: string[];
  /** Product slugs this note belongs to. Makes it appear on those product pages. */
  products: string[];
  /** Experiment refIds this note argues for or against. */
  experiments: string[];
  created: string;
  updated: string;
  body: string;
  /** [[Wikilinks]] found in the body, resolved against the other note titles. */
  links: string[];
  filePath: string;
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim() !== "")
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function extractWikilinks(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(WIKILINK)) {
    found.add(match[1].trim());
  }
  return [...found];
}

async function ensureVault() {
  await fs.mkdir(NOTES_DIR, { recursive: true });
}

function parseNote(filePath: string, raw: string): Note {
  const { data, content } = matter(raw);
  const slug = path.basename(filePath, ".md");
  const title = typeof data.title === "string" && data.title.trim() !== "" ? data.title : slug;
  const now = new Date().toISOString().slice(0, 10);

  return {
    slug,
    title,
    tags: asArray(data.tags),
    products: asArray(data.products),
    experiments: asArray(data.experiments),
    created: typeof data.created === "string" ? data.created : String(data.created ?? now).slice(0, 10),
    updated: typeof data.updated === "string" ? data.updated : String(data.updated ?? now).slice(0, 10),
    body: content.trim(),
    links: extractWikilinks(content),
    filePath,
  };
}

export async function listNotes(): Promise<Note[]> {
  await ensureVault();
  const files = await fg("*.md", { cwd: NOTES_DIR, absolute: true });
  const notes = await Promise.all(
    files.map(async (filePath) => parseNote(filePath, await fs.readFile(filePath, "utf8"))),
  );
  return notes.sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title));
}

export async function getNote(slug: string): Promise<Note | null> {
  await ensureVault();
  const filePath = path.join(NOTES_DIR, `${slug}.md`);
  try {
    return parseNote(filePath, await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

export type NoteInput = {
  title: string;
  tags: string[];
  products: string[];
  experiments: string[];
  body: string;
  created?: string;
};

export async function writeNote(slug: string, input: NoteInput): Promise<Note> {
  await ensureVault();
  const today = new Date().toISOString().slice(0, 10);
  const filePath = path.join(NOTES_DIR, `${slug}.md`);

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(input.title)}`,
    `tags: [${input.tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
    `products: [${input.products.map((p) => JSON.stringify(p)).join(", ")}]`,
    `experiments: [${input.experiments.map((e) => JSON.stringify(e)).join(", ")}]`,
    `created: ${input.created ?? today}`,
    `updated: ${today}`,
    "---",
    "",
  ].join("\n");

  await fs.writeFile(filePath, `${frontmatter}${input.body.trim()}\n`, "utf8");
  return (await getNote(slug))!;
}

export async function deleteNote(slug: string): Promise<void> {
  const filePath = path.join(NOTES_DIR, `${slug}.md`);
  await fs.rm(filePath, { force: true });
}

/** Naive but honest full-text search across titles, tags and bodies. */
export function searchNotes(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  if (q === "") return notes;
  return notes.filter((note) =>
    [note.title, note.tags.join(" "), note.body].join(" ").toLowerCase().includes(q),
  );
}

export function collectTags(notes: Note[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Turn [[Title]] into a link. Unresolved targets point at the create screen,
 * so following a dead link is how you write the missing note.
 */
export function resolveWikilinks(body: string, notes: Note[]): string {
  const byTitle = new Map(notes.map((note) => [note.title.toLowerCase(), note.slug]));
  return body.replace(WIKILINK, (_match, target: string, alias?: string) => {
    const name = target.trim();
    const label = alias?.trim() || name;
    const slug = byTitle.get(name.toLowerCase());
    return slug
      ? `[${label}](/vault/${slug})`
      : `[${label}](/vault/new?title=${encodeURIComponent(name)})`;
  });
}
