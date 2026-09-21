import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperimentWithScore, ProductWithStatus } from "@/lib/queries";
import { DIMENSION_DOT, SURFACE_LABEL, type Dimension, type Surface } from "@/lib/taxonomy";
import { DimensionChip, DimensionLegend } from "./dimension-chip";
import { formatDate } from "@/lib/format";

/** Pain-point 5: what is running on each app, coloured by the dimension it targets. */
export function ExperimentRail({
  products,
  experiments,
}: {
  products: ProductWithStatus[];
  experiments: ExperimentWithScore[];
}) {
  const running = experiments.filter((e) => e.status === "RUNNING");
  const queued = experiments.filter((e) => ["BACKLOG", "SCORED", "READY"].includes(e.status));

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Experiments by product</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {running.length} running, {queued.length} queued across the portfolio.
          </p>
        </div>
        <Link
          href="/experiments"
          className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          Open repository
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {products.map((product) => {
          const mine = experiments.filter((e) => e.productId === product.id);
          const myRunning = mine.filter((e) => e.status === "RUNNING");
          const myQueued = mine.filter((e) => ["BACKLOG", "SCORED", "READY"].includes(e.status));
          const myDecided = mine.filter((e) => e.status === "DECIDED");

          return (
            <div key={product.id} className="px-5 py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Link
                  href={`/products/${product.slug}?tab=experiments`}
                  className="text-sm font-medium hover:underline"
                >
                  {product.name}
                </Link>
                <span className="text-[11px] text-muted-foreground">
                  {myQueued.length} queued · {myDecided.length} decided
                </span>
              </div>

              {myRunning.length === 0 ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {myQueued.length > 0
                    ? `Nothing running. Next up: ${myQueued[0].title}.`
                    : "No experiments recorded yet."}
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {myRunning.map((experiment) => (
                    <li key={experiment.id}>
                      <Link
                        href={`/experiments/${experiment.refId}`}
                        className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/60"
                      >
                        <DimensionChip dimension={experiment.dimension as Dimension} compact />
                        <span className="min-w-0 flex-1 truncate text-xs">{experiment.title}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {SURFACE_LABEL[experiment.surface as Surface]}
                        </span>
                        {experiment.stopDate ? (
                          <span
                            className={cn(
                              "shrink-0 text-[11px]",
                              experiment.overdue
                                ? "font-medium text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground",
                            )}
                          >
                            {experiment.overdue ? "overdue" : `stops ${formatDate(experiment.stopDate)}`}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-5 py-3">
        <DimensionLegend />
      </div>
    </section>
  );
}

/** Portfolio-wide count of experiments per health dimension. */
export function DimensionSpread({ experiments }: { experiments: ExperimentWithScore[] }) {
  const active = experiments.filter((e) => !["ARCHIVED"].includes(e.status));
  const dims: Dimension[] = ["ACQUISITION", "ACTIVATION", "RETENTION", "MONETISATION"];
  const max = Math.max(1, ...dims.map((d) => active.filter((e) => e.dimension === d).length));

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold tracking-tight">Where the effort is pointed</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Every experiment maps to one of the four health dimensions.
      </p>
      <div className="mt-4 space-y-2.5">
        {dims.map((dimension) => {
          const count = active.filter((e) => e.dimension === dimension).length;
          return (
            <div key={dimension} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted-foreground">
                {dimension.charAt(0) + dimension.slice(1).toLowerCase()}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", DIMENSION_DOT[dimension])}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="numeric w-5 shrink-0 text-right text-xs font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
