import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getExperiments, getProductOptions } from "@/lib/queries";
import { NoteEditor } from "@/components/vault/note-editor";

export const dynamic = "force-dynamic";

export const metadata = { title: "New note — Product Ops" };

export default async function NewNotePage({ searchParams }: PageProps<"/vault/new">) {
  const [products, experiments, params] = await Promise.all([
    getProductOptions(),
    getExperiments(),
    searchParams,
  ]);

  const presetProduct = typeof params.product === "string" ? params.product : null;
  const presetTitle = typeof params.title === "string" ? params.title : "";

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href="/vault"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Brainstorm vault
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New note</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {presetTitle
            ? `Following a link that did not resolve yet. Writing this note makes it real.`
            : "For the thought that is not a PRD yet."}
        </p>
      </header>

      <NoteEditor
        note={{
          title: presetTitle,
          tags: [],
          products: presetProduct ? [presetProduct] : [],
          experiments: [],
          body: "",
        }}
        productOptions={products.map((p) => ({ slug: p.slug, name: p.name }))}
        experimentOptions={experiments.map((e) => ({ refId: e.refId, title: e.title }))}
      />
    </div>
  );
}
