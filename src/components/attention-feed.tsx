import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperimentWithScore, ProductWithStatus } from "@/lib/queries";
import { STATUS_SEVERITY } from "@/lib/status";
import { REJECTION_REASON_LABEL, type RejectionReason } from "@/lib/taxonomy";
import { formatDate } from "@/lib/format";

type Item = {
  key: string;
  severity: number;
  href: string;
  title: string;
  detail: string;
  icon: typeof AlertTriangle;
};

/** What is not moving, and who owns it. Sorted by severity, not by recency. */
export function AttentionFeed({
  products,
  experiments,
}: {
  products: ProductWithStatus[];
  experiments: ExperimentWithScore[];
}) {
  const items: Item[] = [];

  for (const product of products) {
    for (const [index, reason] of product.derived.reasons.entries()) {
      items.push({
        key: `${product.slug}-${index}`,
        severity: STATUS_SEVERITY[reason.status],
        href: `/products/${product.slug}`,
        title: product.name,
        detail: reason.message,
        icon: reason.status === "BLOCKED" ? Store : AlertTriangle,
      });
    }
  }

  for (const experiment of experiments) {
    if (!experiment.overdue) continue;
    items.push({
      key: `exp-${experiment.id}`,
      severity: 3,
      href: `/experiments/${experiment.refId}`,
      title: `${experiment.refId} · ${experiment.product.name}`,
      detail: `Past its stop date of ${formatDate(experiment.stopDate!)} with no decision recorded.`,
      icon: Clock,
    });
  }

  items.sort((a, b) => b.severity - a.severity);

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-baseline justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Needs attention</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Derived from evidence, so nothing stays green by neglect.
          </p>
        </div>
        <span className="numeric text-xs text-muted-foreground">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-2.5 px-5 py-8 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          Nothing is stalled, blocked or under threshold. Go build.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
              >
                <item.icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    item.severity >= 4
                      ? "text-rose-500"
                      : item.severity >= 3
                        ? "text-rose-500/80"
                        : "text-amber-500",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Which rejection causes keep coming back, so the process fix is obvious. */
export function RejectionRollup({
  byReason,
}: {
  byReason: { reason: string; count: number; products: string[] }[];
}) {
  if (byReason.length === 0) return null;
  const total = byReason.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight">Why submissions get rejected</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {total} rejection{total === 1 ? "" : "s"} across the portfolio. Recurring causes are
          process problems, not app problems.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {byReason.map((entry) => (
          <li key={entry.reason} className="px-5 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm">
                {REJECTION_REASON_LABEL[entry.reason as RejectionReason] ?? entry.reason}
              </p>
              <span className="numeric shrink-0 text-xs font-medium">{entry.count}x</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{entry.products.join(", ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
