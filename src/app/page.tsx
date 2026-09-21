import Link from "next/link";
import { getExperiments, getPortfolio, getRejectionRollup } from "@/lib/queries";
import { PulseStrip } from "@/components/pulse-strip";
import { PipelineBoard } from "@/components/pipeline-board";
import { ProductCard } from "@/components/product-card";
import { AttentionFeed, RejectionRollup } from "@/components/attention-feed";
import { DimensionSpread, ExperimentRail } from "@/components/experiment-rail";
import { STATUS_SEVERITY } from "@/lib/status";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const [products, experiments, rollup] = await Promise.all([
    getPortfolio(),
    getExperiments(),
    getRejectionRollup(),
  ]);

  if (products.length === 0) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">No products yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Run <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">npm run db:seed</code>{" "}
            to load the example portfolio, or add your first product to start tracking a pipeline.
          </p>
        </div>
      </div>
    );
  }

  const needsAttention = products.filter((p) => STATUS_SEVERITY[p.derived.status] >= 2).length;
  const live = products.filter((p) => p.phase === "POST_PRODUCTION");
  const running = experiments.filter((e) => e.status === "RUNNING").length;

  // Worst first. A dashboard that leads with the good news buries the finding.
  const ordered = [...products].sort(
    (a, b) => STATUS_SEVERITY[b.derived.status] - STATUS_SEVERITY[a.derived.status],
  );

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8 lg:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} products · {live.length} live · {running} experiments running ·{" "}
            {needsAttention === 0 ? (
              "nothing needs attention"
            ) : (
              <span className="font-medium text-foreground">
                {needsAttention} need attention
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/vault">Brainstorm vault</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/experiments">Experiment repository</Link>
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        <PulseStrip products={products} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <PipelineBoard products={products} />

            <section>
              <div className="mb-3">
                <h2 className="text-sm font-semibold tracking-tight">Products</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Worst signal first. Open one for the documents, gates and metrics behind it.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {ordered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    experiments={experiments.filter((e) => e.productId === product.id)}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <AttentionFeed products={products} experiments={experiments} />
            <ExperimentRail products={products} experiments={experiments} />
            <DimensionSpread experiments={experiments} />
            <RejectionRollup byReason={rollup.byReason} />
          </div>
        </div>
      </div>
    </div>
  );
}
