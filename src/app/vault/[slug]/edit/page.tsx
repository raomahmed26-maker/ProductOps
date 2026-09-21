import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getNote } from "@/lib/vault";
import { getExperiments, getProductOptions } from "@/lib/queries";
import { NoteEditor } from "@/components/vault/note-editor";

export const dynamic = "force-dynamic";

export default async function EditNotePage({ params }: PageProps<"/vault/[slug]/edit">) {
  const { slug } = await params;
  const [note, products, experiments] = await Promise.all([
    getNote(slug),
    getProductOptions(),
    getExperiments(),
  ]);
  if (!note) notFound();

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href={`/vault/${note.slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {note.title}
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit note</h1>
      </header>

      <NoteEditor
        note={{
          slug: note.slug,
          title: note.title,
          tags: note.tags,
          products: note.products,
          experiments: note.experiments,
          body: note.body,
        }}
        productOptions={products.map((p) => ({ slug: p.slug, name: p.name }))}
        experimentOptions={experiments.map((e) => ({ refId: e.refId, title: e.title }))}
      />
    </div>
  );
}
