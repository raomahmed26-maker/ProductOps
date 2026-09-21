import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperimentWithScore } from "@/lib/queries";
import {
  CATEGORY_LABEL,
  DECISION_LABEL,
  SURFACE_LABEL,
  type Decision,
  type Dimension,
  type ExperimentCategory,
  type Surface,
} from "@/lib/taxonomy";
import { DECISION_CLASS, canLaunch, deltaVerdict, hypothesisSentence } from "@/lib/experiments";
import { DimensionChip } from "@/components/dimension-chip";
import { formatDate } from "@/lib/format";
import { daysBetween } from "@/lib/status";

export function ExperimentCard({ experiment }: { experiment: ExperimentWithScore }) {
  const ready = canLaunch(experiment);
  const now = new Date();

  return (
    <Link
      href={`/experiments/${experiment.refId}`}
      className={cn(
        "block rounded-xl border bg-card p-4 transition-colors hover:border-foreground/25",
        experiment.overdue ? "border-rose-500/35" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">{experiment.refId}</span>
            <span className="text-xs text-muted-foreground">{experiment.product.name}</span>
          </div>
          <h3 className="mt-0.5 text-sm font-semibold tracking-tight">{experiment.title}</h3>
        </div>
        {experiment.ice != null ? (
          <div className="shrink-0 text-right">
            <p className="numeric text-lg leading-none font-semibold">{experiment.ice}</p>
            <p className="text-[10px] text-muted-foreground">ICE</p>
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <DimensionChip dimension={experiment.dimension as Dimension} />
        <span className="text-[11px] text-muted-foreground">
          {CATEGORY_LABEL[experiment.category as ExperimentCategory]} ·{" "}
          {SURFACE_LABEL[experiment.surface as Surface]}
        </span>
      </div>

      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {hypothesisSentence(experiment)}
      </p>

      {experiment.status === "RUNNING" ? (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-[11px]">
          <span className="text-muted-foreground">
            Day {experiment.startedAt ? daysBetween(experiment.startedAt, now) : 0} ·{" "}
            {experiment.primaryMetric}
          </span>
          {experiment.stopDate ? (
            <span
              className={cn(
                experiment.overdue
                  ? "font-medium text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground",
              )}
            >
              {experiment.overdue
                ? `stop date passed ${formatDate(experiment.stopDate)}`
                : `stops ${formatDate(experiment.stopDate)}`}
            </span>
          ) : null}
        </div>
      ) : null}

      {experiment.result ? (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
          <span className="flex items-center gap-1.5 text-xs">
            <DeltaIcon delta={experiment.result.deltaPercent} />
            <span className="numeric font-medium">
              {experiment.result.deltaPercent > 0 ? "+" : ""}
              {experiment.result.deltaPercent}%
            </span>
            <span className="text-muted-foreground">on {experiment.primaryMetric}</span>
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              DECISION_CLASS[experiment.result.decision as Decision],
            )}
          >
            {DECISION_LABEL[experiment.result.decision as Decision]}
          </span>
        </div>
      ) : null}

      {["BACKLOG", "SCORED", "READY"].includes(experiment.status) ? (
        <div className="mt-3 border-t border-border pt-2.5 text-[11px]">
          {ready ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Launch checklist complete — ready to start
            </span>
          ) : (
            <span className="text-muted-foreground">
              Needs a guardrail metric and a pre-registered stop rule before it can run
            </span>
          )}
        </div>
      ) : null}
    </Link>
  );
}

function DeltaIcon({ delta }: { delta: number }) {
  const verdict = deltaVerdict(delta);
  if (verdict === "up")
    return <ArrowUpRight className="size-3.5 text-emerald-600 dark:text-emerald-400" />;
  if (verdict === "down")
    return <ArrowDownRight className="size-3.5 text-rose-600 dark:text-rose-400" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}
