import { collectTags, listNotes } from "@/lib/vault";
import { getProductOptions } from "@/lib/queries";
import { NoteBrowser, type NoteSummary } from "@/components/vault/note-browser";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Brainstorm vault — Product Ops" };

export default async function VaultPage() {
  const [notes, products] = await Promise.all([listNotes(), getProductOptions()]);

  const summaries: NoteSummary[] = notes.map((note) => ({
    slug: note.slug,
    title: note.title,
    tags: note.tags,
    products: note.products,
    experiments: note.experiments,
    updated: note.updated,
    excerpt: note.body.replace(/[#*_>`[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 200),
    searchText: [note.title, note.tags.join(" "), note.body].join(" ").toLowerCase(),
  }));

  const productNames = Object.fromEntries(products.map((p) => [p.slug, p.name]));

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 lg:px-8 lg:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brainstorm vault</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Plain Markdown files in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">vault/notes</code>.
            Nothing here is in the database, so you can open the folder in Obsidian and the notes are
            just notes.
          </p>
        </div>
        <ButtonLink href="/vault/new" size="sm">
          New note
        </ButtonLink>
      </header>

      <NoteBrowser notes={summaries} tags={collectTags(notes)} productNames={productNames} />
    </div>
  );
}
