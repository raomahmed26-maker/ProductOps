import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Brain, NotebookPen } from "lucide-react";
import { getBrainMessages, getProduct, getProductExperiments } from "@/lib/queries";
import { listNotes } from "@/lib/vault";
import {
  GATE_SPEC,
  PHASES,
  PHASE_GATES,
  PHASE_LABEL,
  type Gate,
  type Phase,
} from "@/lib/taxonomy";
import { formatPlatforms, relativeDays } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { GateRail } from "@/components/gate-rail";
import { StagePanel, type StageData } from "@/components/product/stage-panel";
import { QAPanel } from "@/components/product/qa-panel";
import { ReviewPanel } from "@/components/product/review-panel";
import { HealthPanel } from "@/components/product/health-panel";
import { ExperimentList } from "@/components/product/experiment-list";
import { ProductBrain } from "@/components/product/product-brain";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const filters = await searchParams;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [experiments, allNotes, brainMessages] = await Promise.all([
    getProductExperiments(product.id),
    listNotes(),
    getBrainMessages(product.id),
  ]);
  const notes = allNotes.filter((note) => note.products.includes(product.slug));

  const stageByGate = new Map(product.stages.map((stage) => [stage.gate as Gate, stage]));
  const requestedTab = typeof filters.tab === "string" ? filters.tab : null;
  const tab =
    requestedTab === "brain" ||
    requestedTab === "experiments" ||
    requestedTab === "notes" ||
    (requestedTab && PHASES.includes(requestedTab as Phase))
      ? requestedTab
      : defaultTab(product.phase);

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Portfolio
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            <StatusPill status={product.derived.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            For {product.audience} · {formatPlatforms(product.platforms)}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <ButtonLink href={`/products/${product.slug}?tab=brain`} size="sm" variant="outline">
            <Brain className="size-3.5" />
            Ask the brain
          </ButtonLink>
          <ButtonLink href={`/products/${product.slug}/edit`} size="sm" variant="outline">
            Edit product
          </ButtonLink>
          <div className="text-right text-xs text-muted-foreground">
            <p>
              {PHASE_LABEL[product.phase]} · {GATE_SPEC[product.currentGate].label}
            </p>
            <p className="mt-0.5">Gate last moved {relativeDays(product.derived.daysSinceActivity)}</p>
          </div>
        </div>
      </header>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <GateRail stages={product.stages} currentGate={product.currentGate} showLabels />
        <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="eyebrow">Next action</p>
            <p className="mt-1 text-sm font-medium">{product.derived.nextAction}</p>
            {product.derived.reasons.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {product.derived.reasons.map((reason, index) => (
                  <li key={index} className="text-xs text-muted-foreground">
                    {reason.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Nothing is stalled, blocked or over its window.
              </p>
            )}
          </div>
          <div className="text-xs text-muted-foreground sm:text-right">
            <p>{product.progress}% of gates complete</p>
            {product.derived.gateAgeDays == null ? null : product.currentGate === "LIVE" ? (
              <p className="mt-0.5">
                Live for {Math.round(product.derived.gateAgeDays / 7)} weeks
              </p>
            ) : (
              <p className="mt-0.5">
                {product.derived.gateAgeDays} days in this gate, {product.derived.gateExpectedDays}{" "}
                expected
              </p>
            )}
          </div>
        </div>
      </div>

      <Tabs key={tab} defaultValue={tab} className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="brain">Brain</TabsTrigger>
          {PHASES.map((phase) => (
            <TabsTrigger key={phase} value={phase}>
              {PHASE_LABEL[phase]}
            </TabsTrigger>
          ))}
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="brain" className="mt-5">
          <ProductBrain
            productId={product.id}
            productName={product.name}
            brief={product.brief}
            messages={brainMessages}
          />
        </TabsContent>

        {PHASES.map((phase) => (
          <TabsContent key={phase} value={phase} className="mt-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              {PHASE_GATES[phase].length} gate{PHASE_GATES[phase].length === 1 ? "" : "s"} in{" "}
              {PHASE_LABEL[phase].toLowerCase()}.
            </p>

            {PHASE_GATES[phase].map((gate) => {
              const stage = stageByGate.get(gate);
              if (!stage) return null;
              return (
                <StagePanel
                  key={gate}
                  stage={stage as StageData}
                  isCurrent={gate === product.currentGate}
                >
                  {gate === "QA" ? <QAPanel stageId={stage.id} cycles={stage.qaCycles} /> : null}
                  {gate === "STORE_SUBMISSION" ? (
                    <ReviewPanel productId={product.id} submissions={product.submissions} />
                  ) : null}
                </StagePanel>
              );
            })}

            {phase === "POST_PRODUCTION" ? (
              <HealthPanel
                productId={product.id}
                metrics={product.metrics}
                thresholds={{
                  minWeeklyInstalls: product.minWeeklyInstalls,
                  minD1: product.minD1,
                  minD7: product.minD7,
                }}
              />
            ) : null}
          </TabsContent>
        ))}

        <TabsContent value="experiments" className="mt-5 space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Every experiment ever run on {product.name}, whatever surface it touched.
            </p>
            <ButtonLink href={`/experiments/new?product=${product.slug}`} size="sm" variant="outline">
              New experiment
            </ButtonLink>
          </div>

          <Section title="Running">
            <ExperimentList
              experiments={experiments.filter((e) => e.status === "RUNNING")}
              emptyMessage="Nothing running on this product right now."
            />
          </Section>

          <Section title="Queued">
            <ExperimentList
              experiments={experiments.filter((e) =>
                ["BACKLOG", "SCORED", "READY"].includes(e.status),
              )}
              emptyMessage="The backlog is empty. A finished experiment usually suggests the next one."
            />
          </Section>

          <Section title="Decided">
            <ExperimentList
              experiments={experiments.filter((e) => ["DECIDED", "ANALYSIS"].includes(e.status))}
              emptyMessage="Nothing decided yet."
            />
          </Section>
        </TabsContent>

        <TabsContent value="notes" className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Notes from the vault tagged to this product.
            </p>
            <ButtonLink href={`/vault/new?product=${product.slug}`} size="sm" variant="outline">
              New note
            </ButtonLink>
          </div>

          {notes.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <NotebookPen className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No notes on {product.name} yet</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Half-formed thinking goes here before it becomes a PRD or an experiment. Add{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                  products: [{product.slug}]
                </code>{" "}
                to a note&apos;s frontmatter and it shows up on this tab.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
              {notes.map((note) => (
                <li key={note.slug}>
                  <Link
                    href={`/vault/${note.slug}`}
                    className="block px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <p className="text-sm font-medium">{note.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {note.body.replace(/[#*_>`[\]]/g, "").slice(0, 160)}
                    </p>
                    {note.tags.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <footer className="mt-10 border-t border-border pt-5">
        <p className="text-xs text-muted-foreground">
          Every document above is a link to where the file really lives. Nothing is copied into this
          workspace, so there is only ever one version of the truth.
        </p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function defaultTab(phase: Phase): string {
  return phase;
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product ? `${product.name} — Product Ops` : "Product not found" };
}
