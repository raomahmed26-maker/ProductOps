import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductOptions } from "@/lib/queries";
import { ExperimentForm } from "@/components/experiments/experiment-form";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export const metadata = { title: "New experiment — Product Ops" };

export default async function NewExperimentPage({ searchParams }: PageProps<"/experiments/new">) {
  const [products, params] = await Promise.all([getProductOptions(), searchParams]);
  const productSlug = typeof params.product === "string" ? params.product : null;
  const defaultProductId = products.find((product) => product.slug === productSlug)?.id;

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href="/experiments"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Experiment repository
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">New experiment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This goes to the backlog. Score it, complete the launch checklist, then start the run.
        </p>
      </header>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm font-medium">Add a product first</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Experiments belong to a product. There is nothing to hang this record on yet.
          </p>
          <div className="mt-4">
            <ButtonLink href="/products/new" size="sm">
              Add a product
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ExperimentForm products={products} defaultProductId={defaultProductId} />
      )}
    </div>
  );
}
