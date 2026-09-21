"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "./db";
import { deleteNote, getNote, slugify, writeNote } from "./vault";

export type VaultResult = { ok: true; slug: string } | { ok: false; error: string };

const noteSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(1, "Give the note a title"),
  tags: z.string().optional(),
  products: z.string().optional(),
  experiments: z.string().optional(),
  body: z.string().default(""),
});

function toList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function saveNote(formData: FormData): Promise<VaultResult> {
  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  const slug = input.slug?.trim() || slugify(input.title);
  if (slug === "") return { ok: false, error: "That title does not produce a usable filename" };

  const existing = await getNote(slug);
  if (!input.slug && existing) {
    return { ok: false, error: "A note with that title already exists" };
  }

  await writeNote(slug, {
    title: input.title,
    tags: toList(input.tags),
    products: toList(input.products),
    experiments: toList(input.experiments),
    body: input.body,
    created: existing?.created,
  });

  revalidatePath("/vault");
  revalidatePath(`/vault/${slug}`);
  revalidatePath("/");
  return { ok: true, slug };
}

export async function removeNote(slug: string): Promise<VaultResult> {
  await deleteNote(slug);
  revalidatePath("/vault");
  return { ok: true, slug };
}

/**
 * Turn a brainstorm note into a backlog experiment, carrying the note across as
 * the rationale so the thinking does not get separated from the test.
 */
export async function promoteNoteToExperiment(
  slug: string,
  productId: string,
): Promise<{ ok: true; refId: string } | { ok: false; error: string }> {
  const note = await getNote(slug);
  if (!note) return { ok: false, error: "That note no longer exists" };

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, error: "Pick a product first" };

  const last = await db.experiment.findFirst({
    orderBy: { refId: "desc" },
    select: { refId: true },
  });
  const n = last ? Number(last.refId.replace(/\D/g, "")) + 1 : 1;
  const refId = `EXP-${String(n).padStart(3, "0")}`;

  const excerpt = note.body.replace(/\s+/g, " ").trim().slice(0, 400);

  await db.experiment.create({
    data: {
      refId,
      productId,
      title: note.title,
      category: "IN_APP",
      surface: "OTHER",
      dimension: "RETENTION",
      changeDescription: "",
      audience: "",
      expectedMetric: "",
      expectedDirection: "UP",
      expectedSize: "",
      timeframe: "",
      rationale: excerpt || `From the vault note "${note.title}".`,
      primaryMetric: "",
      status: "BACKLOG",
      owner: "Unassigned",
    },
  });

  // Keep the link in both directions so the note shows on the experiment page.
  await writeNote(slug, {
    title: note.title,
    tags: note.tags,
    products: note.products.includes(product.slug) ? note.products : [...note.products, product.slug],
    experiments: [...note.experiments, refId],
    body: note.body,
    created: note.created,
  });

  revalidatePath("/vault");
  revalidatePath(`/vault/${slug}`);
  revalidatePath("/experiments");
  return { ok: true, refId };
}
