import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProductWithStatus } from "@/lib/queries";
import { GATE_SPEC, PHASES, PHASE_BLURB, PHASE_LABEL, type Phase } from "@/lib/taxonomy";
import { STATUS_DOT } from "@/lib/status";
import { relativeDays } from "@/lib/format";

/**
 * Four phase columns. The card itself carries the exception cue, so a healthy
 * board is quiet and a troubled one is not.
 */
export function PipelineBoard({ products }: { products: ProductWithStatus[] }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold tracking-tight">Pipeline</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Where each product sits, and how long it has been sitting there.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {PHASES.map((phase) => {
          const inPhase = products.filter((product) => product.phase === phase);
          return (
            <div
              key={phase}
              className="flex min-h-40 flex-col rounded-xl border border-border bg-muted/35 p-3"
            >
              <div className="mb-3 px-1">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xs font-semibold tracking-tight">{PHASE_LABEL[phase]}</h3>
                  <span className="numeric text-xs text-muted-foreground">{inPhase.length}</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {PHASE_BLURB[phase]}
                </p>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {inPhase.length === 0 ? (
                  <p className="grid flex-1 place-items-center rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                    Nothing in {PHASE_LABEL[phase].toLowerCase()}
                  </p>
                ) : (
                  inPhase.map((product) => (
                    <PipelineCard key={product.slug} product={product} phase={phase} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PipelineCard({ product, phase }: { product: ProductWithStatus; phase: Phase }) {
  const { derived } = product;
  const alarming = ["STALLED", "BLOCKED", "KILL_WATCH"].includes(derived.status);
  const warning = derived.status === "AT_RISK";

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "rounded-lg border bg-card p-3 transition-colors hover:border-foreground/25",
        alarming && "border-rose-500/35",
        warning && "border-amber-500/35",
        !alarming && !warning && "border-border",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", STATUS_DOT[derived.status])}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {GATE_SPEC[product.currentGate].label}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          {product.currentGate === "LIVE"
            ? `live ${Math.round((derived.gateAgeDays ?? 0) / 7)} weeks`
            : derived.gateAgeDays == null
              ? "not started"
              : `${derived.gateAgeDays}d in gate / ${derived.gateExpectedDays}d`}
        </span>
        {derived.gateOverrunDays > 0 && product.currentGate !== "LIVE" ? (
          <span className="font-medium text-amber-600 dark:text-amber-400">
            +{derived.gateOverrunDays}d over
          </span>
        ) : (
          <span className="text-muted-foreground/70">{relativeDays(derived.daysSinceActivity)}</span>
        )}
      </div>

      {phase === "REVIEW" && product.submissions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {product.submissions.slice(0, 2).map((submission) => (
            <span
              key={submission.id}
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px]",
                submission.status === "REJECTED"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {submission.platform === "APP_STORE" ? "App Store" : "Play Store"} ·{" "}
              {submission.status.toLowerCase().replace("_", " ")}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
