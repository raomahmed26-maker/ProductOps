import Link from "next/link";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductWithStatus } from "@/lib/queries";
import type { ExperimentWithScore } from "@/lib/queries";
import { GATE_SPEC, PHASE_LABEL, type Dimension } from "@/lib/taxonomy";
import { formatCompact, formatPercent, relativeDays, signed } from "@/lib/format";
import { StatusPill } from "./status-pill";
import { GateRail } from "./gate-rail";
import { DimensionChip } from "./dimension-chip";

function Metric({
  label,
  value,
  delta,
  failing,
}: {
  label: string;
  value: string;
  delta?: string | null;
  failing?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "numeric mt-0.5 text-sm font-semibold",
          failing && "text-rose-600 dark:text-rose-400",
        )}
      >
        {value}
        {delta ? (
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">{delta}</span>
        ) : null}
      </p>
    </div>
  );
}

export function ProductCard({
  product,
  experiments,
}: {
  product: ProductWithStatus;
  experiments: ExperimentWithScore[];
}) {
  const { derived, health } = product;
  const running = experiments.filter((e) => e.status === "RUNNING");
  const queued = experiments.filter((e) => ["BACKLOG", "SCORED", "READY"].includes(e.status));

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-semibold tracking-tight">
            <span className="truncate">{product.name}</span>
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{product.tagline}</p>
        </div>
        <StatusPill status={derived.status} size="sm" />
      </div>

      <div className="mt-4">
        <GateRail stages={product.stages} currentGate={product.currentGate} />
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {PHASE_LABEL[product.phase]} · {GATE_SPEC[product.currentGate].short}
          </span>
          <span>gate moved {relativeDays(derived.daysSinceActivity)}</span>
        </div>
      </div>

      {health ? (
        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-border pt-4">
          <Metric
            label="Installs"
            value={formatCompact(health.latest.installs)}
            delta={health.installsDelta != null ? signed(health.installsDelta) : null}
            failing={health.failing.includes("Weekly installs")}
          />
          <Metric
            label="Activation"
            value={formatPercent(health.latest.activationRate, 0)}
          />
          <Metric
            label="D1"
            value={formatPercent(health.latest.d1, 0)}
            delta={health.d1Delta != null ? signed(health.d1Delta, 1) : null}
            failing={health.failing.includes("D1 retention")}
          />
          <Metric
            label="D7"
            value={formatPercent(health.latest.d7, 0)}
            delta={health.d7Delta != null ? signed(health.d7Delta, 1) : null}
            failing={health.failing.includes("D7 retention")}
          />
        </div>
      ) : (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Gate intent</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {GATE_SPEC[product.currentGate].intent}
          </p>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Next action</p>
        <p className="mt-1 text-sm">{derived.nextAction}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
        <FlaskConical className="size-3.5 shrink-0 text-muted-foreground" />
        {running.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            {queued.length > 0
              ? `Nothing running · ${queued.length} queued`
              : "No experiments yet"}
          </span>
        ) : (
          <>
            {running.slice(0, 3).map((experiment) => (
              <DimensionChip
                key={experiment.id}
                dimension={experiment.dimension as Dimension}
                compact
              />
            ))}
            <span className="text-xs text-muted-foreground">
              {running.length} running · {queued.length} queued
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
