import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, FileText } from "lucide-react";
import { getNote, listNotes, resolveWikilinks } from "@/lib/vault";
import { getExperiments, getProductOptions } from "@/lib/queries";
import { ButtonLink } from "@/components/ui/button-link";
import { PromoteToExperiment } from "@/components/vault/promote-to-experiment";

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: PageProps<"/vault/[slug]">) {
  const { slug } = await params;
  const [note, notes, products, experiments] = await Promise.all([
    getNote(slug),
    listNotes(),
    getProductOptions(),
    getExperiments(),
  ]);
  if (!note) notFound();

  const rendered = resolveWikilinks(note.body, notes);
  const linkedProducts = products.filter((product) => note.products.includes(product.slug));
  const linkedExperiments = experiments.filter((experiment) =>
    note.experiments.includes(experiment.refId),
  );

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href="/vault"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Brainstorm vault
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{note.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {note.created} · updated {note.updated} ·{" "}
            <span className="font-mono">vault/notes/{note.slug}.md</span>
          </p>
        </div>
        <ButtonLink href={`/vault/${note.slug}/edit`} size="sm" variant="outline">
          Edit
        </ButtonLink>
      </header>

      {note.tags.length > 0 || linkedProducts.length > 0 || linkedExperiments.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {note.tags.map((tag) => (
            <span key={tag} className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              #{tag}
            </span>
          ))}
          {linkedProducts.map((product) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="rounded border border-border px-2 py-0.5 text-[11px] hover:border-foreground/25"
            >
              {product.name}
            </Link>
          ))}
          {linkedExperiments.map((experiment) => (
            <Link
              key={experiment.refId}
              href={`/experiments/${experiment.refId}`}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] hover:border-foreground/25"
            >
              {experiment.refId}
            </Link>
          ))}
        </div>
      ) : null}

      <article className="mt-6 rounded-xl border border-border bg-card px-6 py-6">
        {note.body.trim() === "" ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">This note is empty.</p>
          </div>
        ) : (
          <div className="prose-note">
            <Markdown remarkPlugins={[remarkGfm]}>{rendered}</Markdown>
          </div>
        )}
      </article>

      <div className="mt-6">
        <PromoteToExperiment
          slug={note.slug}
          products={products.map((product) => ({ id: product.id, name: product.name }))}
          alreadyLinked={linkedExperiments.map((experiment) => experiment.refId)}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps<"/vault/[slug]">) {
  const { slug } = await params;
  const note = await getNote(slug);
  return { title: note ? `${note.title} — Vault` : "Note not found" };
}
