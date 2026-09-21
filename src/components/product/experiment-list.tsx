import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ExperimentWithScore } from "@/lib/queries";
import {
  CATEGORY_LABEL,
  EXPERIMENT_STATUS_LABEL,
  SURFACE_LABEL,
  type Dimension,
  type ExperimentCategory,
  type ExperimentStatus,
  type Surface,
} from "@/lib/taxonomy";
import { DECISION_CLASS, EXPERIMENT_STATUS_CLASS } from "@/lib/experiments";
import { DECISION_LABEL, type Decision } from "@/lib/taxonomy";
import { DimensionChip } from "@/components/dimension-chip";
import { formatDate } from "@/lib/format";

export function ExperimentList({
  experiments,
  emptyMessage,
}: {
  experiments: ExperimentWithScore[];
  emptyMessage: string;
}) {
  if (experiments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {experiments.map((experiment) => (
        <li key={experiment.id}>
          <Link
            href={`/experiments/${experiment.refId}`}
            className="block px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">{experiment.refId}</span>
              <span className="text-sm font-medium">{experiment.title}</span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  EXPERIMENT_STATUS_CLASS[experiment.status as ExperimentStatus],
                )}
              >
                {EXPERIMENT_STATUS_LABEL[experiment.status as ExperimentStatus]}
              </span>
              {experiment.overdue ? (
                <span className="rounded-full border border-rose-500/30 bg-rose-500/12 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
                  past stop date
                </span>
              ) : null}
              {experiment.result ? (
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    DECISION_CLASS[experiment.result.decision as Decision],
                  )}
                >
                  {DECISION_LABEL[experiment.result.decision as Decision]}
                </span>
              ) : null}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <DimensionChip dimension={experiment.dimension as Dimension} />
              <span>
                {CATEGORY_LABEL[experiment.category as ExperimentCategory]} ·{" "}
                {SURFACE_LABEL[experiment.surface as Surface]}
              </span>
              {experiment.ice != null ? <span>ICE {experiment.ice}</span> : null}
              {experiment.startedAt ? <span>started {formatDate(experiment.startedAt)}</span> : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
