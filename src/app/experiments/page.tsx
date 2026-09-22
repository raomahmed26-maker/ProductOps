import { FlaskConical } from "lucide-react";
import { getExperiments, getProductOptions } from "@/lib/queries";
import { ExperimentCard } from "@/components/experiments/experiment-card";
import { FilterBar } from "@/components/experiments/filter-bar";
import { ButtonLink } from "@/components/ui/button-link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DimensionLegend } from "@/components/dimension-chip";
import type { ExperimentWithScore } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ExperimentsPage({ searchParams }: PageProps<"/experiments">) {
  const [experiments, products, filters] = await Promise.all([
    getExperiments(),
    getProductOptions(),
    searchParams,
  ]);

  const productSlug = typeof filters.product === "string" ? filters.product : null;
  const dimension = typeof filters.dimension === "string" ? filters.dimension : null;
  const category = typeof filters.category === "string" ? filters.category : null;

  const filtered = experiments.filter((experiment) => {
    if (productSlug && experiment.product.slug !== productSlug) return false;
    if (dimension && experiment.dimension !== dimension) return false;
    if (category && experiment.category !== category) return false;
    return true;
  });

  // Highest ICE first, unscored last. Scoring before debate is the whole point.
  const backlog = filtered
    .filter((e) => ["BACKLOG", "SCORED", "READY"].includes(e.status))
    .sort((a, b) => (b.ice ?? -1) - (a.ice ?? -1));
  const running = filtered
    .filter((e) => ["RUNNING", "ANALYSIS"].includes(e.status))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue));
  const library = filtered
    .filter((e) => ["DECIDED", "ARCHIVED"].includes(e.status))
    .sort((a, b) => (b.endedAt?.getTime() ?? 0) - (a.endedAt?.getTime() ?? 0));

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Experiment repository</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            One record per experiment, whether it is a paywall test, a Reddit post or a CPI
            campaign. Plan, run and decision live together so a result can still be read a year
            later.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/guide#how-to-set-up-experiments" variant="outline" size="sm">
            How experiments work
          </ButtonLink>
          <ButtonLink href={products.length === 0 ? "/products/new" : "/experiments/new"} size="sm">
            {products.length === 0 ? "Add a product first" : "New experiment"}
          </ButtonLink>
        </div>
      </header>

      <div className="mt-6 rounded-xl border border-border bg-card px-5 py-4">
        <FilterBar
          products={products.map((product) => ({ value: product.slug, label: product.name }))}
        />
      </div>

      <Tabs defaultValue={running.length > 0 ? "running" : "backlog"} className="mt-6">
        <TabsList>
          <TabsTrigger value="backlog">Backlog · {backlog.length}</TabsTrigger>
          <TabsTrigger value="running">Running · {running.length}</TabsTrigger>
          <TabsTrigger value="library">Library · {library.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="backlog" className="mt-5">
          <p className="mb-3 text-xs text-muted-foreground">
            Ranked by ICE, highest first. Score each idea independently before you argue about it,
            so priority reflects evidence rather than whoever is loudest.
          </p>
          <Grid experiments={backlog} empty="Nothing queued. A decided experiment usually suggests its own follow-up." />
        </TabsContent>

        <TabsContent value="running" className="mt-5">
          <p className="mb-3 text-xs text-muted-foreground">
            Overdue runs float to the top. A run past its own stop rule with no decision recorded is
            how teams talk themselves into a result.
          </p>
          <Grid experiments={running} empty="Nothing is running right now." />
        </TabsContent>

        <TabsContent value="library" className="mt-5">
          <p className="mb-3 text-xs text-muted-foreground">
            Every decided experiment, win or loss. This is the part that compounds.
          </p>
          <Grid experiments={library} empty="No decisions recorded yet." />
        </TabsContent>
      </Tabs>

      <div className="mt-8 border-t border-border pt-5">
        <DimensionLegend />
      </div>
    </div>
  );
}

function Grid({ experiments, empty }: { experiments: ExperimentWithScore[]; empty: string }) {
  if (experiments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <FlaskConical className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {experiments.map((experiment) => (
        <ExperimentCard key={experiment.id} experiment={experiment} />
      ))}
    </div>
  );
}
