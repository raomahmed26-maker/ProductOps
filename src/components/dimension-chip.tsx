import { cn } from "@/lib/utils";
import { DIMENSION_CLASS, DIMENSION_DOT, DIMENSION_LABEL, type Dimension } from "@/lib/taxonomy";

export function DimensionChip({
  dimension,
  className,
  compact = false,
}: {
  dimension: Dimension;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        DIMENSION_CLASS[dimension],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DIMENSION_DOT[dimension])} aria-hidden />
      {compact ? DIMENSION_LABEL[dimension].slice(0, 4) : DIMENSION_LABEL[dimension]}
    </span>
  );
}

export function DimensionLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {(Object.keys(DIMENSION_LABEL) as Dimension[]).map((dimension) => (
        <span
          key={dimension}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span className={cn("size-1.5 rounded-full", DIMENSION_DOT[dimension])} aria-hidden />
          {DIMENSION_LABEL[dimension]}
        </span>
      ))}
    </div>
  );
}
