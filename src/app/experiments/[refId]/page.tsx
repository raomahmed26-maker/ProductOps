import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getExperiment } from "@/lib/queries";
import { listNotes } from "@/lib/vault";
import {
  CATEGORY_LABEL,
  DIMENSION_LABEL,
  EXPERIMENT_STATUS_LABEL,
  SURFACE_LABEL,
  type Dimension,
  type ExperimentCategory,
  type ExperimentStatus,
  type Surface,
} from "@/lib/taxonomy";
import { EXPERIMENT_STATUS_CLASS, hypothesisSentence } from "@/lib/experiments";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { DimensionChip } from "@/components/dimension-chip";
import { LaunchChecklist } from "@/components/experiments/launch-checklist";
import { IceScorer } from "@/components/experiments/ice-scorer";
import { ResultRecorder } from "@/components/experiments/result-recorder";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export default async function ExperimentPage({ params }: PageProps<"/experiments/[refId]">) {
  const { refId } = await params;
  const experiment = await getExperiment(refId);
  if (!experiment) notFound();

  const notes = (await listNotes()).filter((note) => note.experiments.includes(experiment.refId));

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href="/experiments"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Experiment repository
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{experiment.refId}</span>
          <Link
            href={`/products/${experiment.product.slug}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            {experiment.product.name}
          </Link>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
              EXPERIMENT_STATUS_CLASS[experiment.status as ExperimentStatus],
            )}
          >
            {EXPERIMENT_STATUS_LABEL[experiment.status as ExperimentStatus]}
          </span>
          {experiment.overdue ? (
            <span className="rounded-full border border-rose-500/30 bg-rose-500/12 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
              past its stop date
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{experiment.title}</h1>
          <ButtonLink href={`/experiments/${experiment.refId}/edit`} size="sm" variant="outline">
            Edit record
          </ButtonLink>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DimensionChip dimension={experiment.dimension as Dimension} />
          <span className="text-xs text-muted-foreground">
            {CATEGORY_LABEL[experiment.category as ExperimentCategory]} ·{" "}
            {SURFACE_LABEL[experiment.surface as Surface]} · owned by {experiment.owner}
          </span>
        </div>
      </header>

      <section className="mt-6 rounded-xl border border-border bg-card px-5 py-5">
        <p className="eyebrow">Hypothesis</p>
        <p className="mt-2 text-base leading-relaxed">{hypothesisSentence(experiment)}</p>
        {experiment.parent ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Follows{" "}
            <Link href={`/experiments/${experiment.parent.refId}`} className="hover:underline">
              {experiment.parent.refId} · {experiment.parent.title}
            </Link>
          </p>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Measurement</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                One metric decides it. The guardrail says what must not get worse.
              </p>
            </div>
            <dl className="divide-y divide-border">
              <Row label="Primary metric" value={experiment.primaryMetric} />
              <Row label="Secondary" value={experiment.secondaryMetrics} />
              <Row label="Guardrail" value={experiment.guardrailMetric} />
              <Row label="Minimum detectable effect" value={experiment.minDetectableEffect} />
              <Row label="Kill criteria" value={experiment.killCriteria} />
              <Row
                label="Stop rule"
                value={
                  [
                    experiment.stopDate ? `by ${formatDate(experiment.stopDate)}` : null,
                    experiment.minSampleSize
                      ? `or ${experiment.minSampleSize.toLocaleString()} exposures`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" ") || null
                }
              />
              <Row label="Variants" value={experiment.variantSummary} />
              <Row
                label="Dates"
                value={
                  [
                    experiment.startedAt ? `started ${formatDate(experiment.startedAt)}` : null,
                    experiment.endedAt ? `ended ${formatDate(experiment.endedAt)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || null
                }
              />
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="eyebrow">Why we believe it</p>
            <p className="mt-1.5 text-sm leading-relaxed">{experiment.rationale}</p>
            {experiment.assetUrl ? (
              <a
                href={experiment.assetUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                What users saw
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </section>

          <ResultRecorder
            experimentId={experiment.id}
            primaryMetric={experiment.primaryMetric}
            result={experiment.result}
            followUps={experiment.children}
          />

          {notes.length > 0 ? (
            <section className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold tracking-tight">Notes from the vault</h2>
              </div>
              <ul className="divide-y divide-border">
                {notes.map((note) => (
                  <li key={note.slug}>
                    <Link
                      href={`/vault/${note.slug}`}
                      className="block px-5 py-3 transition-colors hover:bg-muted/50"
                    >
                      <p className="text-sm font-medium">{note.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {note.body.replace(/[#*_>`[\]]/g, "").slice(0, 150)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <LaunchChecklist
            experimentId={experiment.id}
            experiment={experiment}
            status={experiment.status as ExperimentStatus}
          />
          <IceScorer
            experimentId={experiment.id}
            initial={{
              impact: experiment.iceImpact,
              confidence: experiment.iceConfidence,
              ease: experiment.iceEase,
            }}
          />

          <section className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="eyebrow">Health dimension</p>
            <p className="mt-1.5 text-sm">
              This targets <strong>{DIMENSION_LABEL[experiment.dimension as Dimension]}</strong>. It
              shows on the {experiment.product.name} card and in the portfolio rail under that
              colour.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-0.5 px-5 py-2.5">
      <dt className="w-52 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 flex-1 text-sm", !value && "text-muted-foreground/60")}>
        {value ?? "Not recorded"}
      </dd>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps<"/experiments/[refId]">) {
  const { refId } = await params;
  const experiment = await getExperiment(refId);
  return { title: experiment ? `${experiment.refId} — ${experiment.title}` : "Experiment not found" };
}
