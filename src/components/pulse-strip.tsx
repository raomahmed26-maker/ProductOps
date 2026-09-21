import Link from "next/link";
import { cn } from "@/lib/utils";
import { ABANDONED_THRESHOLD_DAYS, STALL_THRESHOLD_DAYS, STATUS_DOT } from "@/lib/status";
import type { ProductWithStatus } from "@/lib/queries";
import { relativeDays } from "@/lib/format";

/**
 * Every product on one axis of days-since-last-update. Work piling up on the
 * right is work nobody is asking about — which is the finding, not the detail.
 */
export function PulseStrip({ products }: { products: ProductWithStatus[] }) {
  const maxDays = Math.max(
    ABANDONED_THRESHOLD_DAYS + 6,
    ...products.map((p) => p.derived.daysSinceActivity),
  );
  const position = (days: number) => Math.min(100, (days / maxDays) * 100);
  const stalled = products.filter((p) => p.derived.daysSinceActivity >= STALL_THRESHOLD_DAYS);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Portfolio pulse</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Days since anything moved on each product.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {stalled.length === 0 ? (
            "Everything has moved inside the stall line."
          ) : (
            <span className="font-medium text-rose-600 dark:text-rose-400">
              {stalled.length} past the {STALL_THRESHOLD_DAYS}-day stall line
            </span>
          )}
        </p>
      </div>

      <div className="relative mt-8 mb-2">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" aria-hidden />

        <div
          className="absolute top-1/2 h-14 w-px -translate-y-1/2 border-l border-dashed border-amber-500/60"
          style={{ left: `${position(STALL_THRESHOLD_DAYS)}%` }}
          aria-hidden
        />
        <span
          className="absolute -top-7 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap text-amber-600 dark:text-amber-400"
          style={{ left: `${position(STALL_THRESHOLD_DAYS)}%` }}
        >
          stall · {STALL_THRESHOLD_DAYS}d
        </span>

        <div
          className="absolute top-1/2 h-14 w-px -translate-y-1/2 border-l border-dashed border-rose-500/60"
          style={{ left: `${position(ABANDONED_THRESHOLD_DAYS)}%` }}
          aria-hidden
        />
        <span
          className="absolute -top-7 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap text-rose-600 dark:text-rose-400"
          style={{ left: `${position(ABANDONED_THRESHOLD_DAYS)}%` }}
        >
          abandoned · {ABANDONED_THRESHOLD_DAYS}d
        </span>

        <div className="relative h-14">
          {products.map((product, index) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${position(product.derived.daysSinceActivity)}%`,
                // Nudge alternate markers so overlapping products stay readable.
                marginTop: `${(index % 3) * 14 - 14}px`,
              }}
              title={`${product.name} — ${relativeDays(product.derived.daysSinceActivity)}`}
            >
              <span
                className={cn(
                  "block size-2.5 rounded-full ring-3 ring-card transition-transform group-hover:scale-125",
                  STATUS_DOT[product.derived.status],
                )}
              />
              <span className="pointer-events-none absolute top-4 left-1/2 hidden -translate-x-1/2 rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow-sm group-hover:block">
                {product.name} · {product.derived.daysSinceActivity}d
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>today</span>
        <span>{maxDays} days idle</span>
      </div>
    </section>
  );
}
