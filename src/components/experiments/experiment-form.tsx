"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect } from "@/components/forms/field";
import { saveExperiment } from "@/lib/actions";
import { SURFACE_DEFAULT_DIMENSION, hypothesisSentence } from "@/lib/experiments";
import {
  CATEGORY_LABEL,
  CATEGORY_SURFACES,
  DIMENSIONS,
  DIMENSION_LABEL,
  EXPERIMENT_CATEGORIES,
  SURFACE_LABEL,
  type Dimension,
  type ExperimentCategory,
  type Surface,
} from "@/lib/taxonomy";
import { toInputDate } from "@/lib/format";

export type ExperimentFormValues = {
  id: string;
  refId: string;
  productId: string;
  title: string;
  category: string;
  surface: string;
  dimension: string;
  changeDescription: string;
  audience: string;
  expectedMetric: string;
  expectedDirection: string;
  expectedSize: string;
  timeframe: string;
  rationale: string;
  primaryMetric: string;
  secondaryMetrics: string | null;
  guardrailMetric: string | null;
  minDetectableEffect: string | null;
  killCriteria: string | null;
  stopDate: Date | null;
  minSampleSize: number | null;
  owner: string;
  variantSummary: string | null;
  assetUrl: string | null;
};

export function ExperimentForm({
  products,
  experiment,
  defaultProductId,
}: {
  products: { id: string; name: string }[];
  experiment?: ExperimentFormValues;
  defaultProductId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [category, setCategory] = useState<ExperimentCategory>(
    (experiment?.category as ExperimentCategory) ?? "IN_APP",
  );
  const [surface, setSurface] = useState<Surface>((experiment?.surface as Surface) ?? "PAYWALL");
  const [dimension, setDimension] = useState<Dimension>(
    (experiment?.dimension as Dimension) ?? "MONETISATION",
  );

  // Live preview of the enforced sentence, so the shape is obvious while typing.
  const [parts, setParts] = useState({
    changeDescription: experiment?.changeDescription ?? "",
    audience: experiment?.audience ?? "",
    expectedMetric: experiment?.expectedMetric ?? "",
    expectedDirection: experiment?.expectedDirection ?? "UP",
    expectedSize: experiment?.expectedSize ?? "",
    timeframe: experiment?.timeframe ?? "",
    rationale: experiment?.rationale ?? "",
  });

  function update(key: keyof typeof parts) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setParts((prev) => ({ ...prev, [key]: event.target.value }));
  }

  function chooseSurface(next: Surface) {
    setSurface(next);
    const suggested = SURFACE_DEFAULT_DIMENSION[next];
    if (suggested) setDimension(suggested);
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveExperiment(experiment?.id ?? null, formData);
      if (result.ok) {
        toast.success(experiment ? "Experiment updated" : "Experiment added to the backlog");
        router.push(`/experiments/${result.refId}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  const preview = hypothesisSentence(parts);
  const complete = parts.changeDescription && parts.audience && parts.expectedMetric;

  return (
    <form action={submit} className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">What and where</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            In-app, business development or promotional — one repository for all three.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product" htmlFor="x-product">
            <NativeSelect
              id="x-product"
              name="productId"
              defaultValue={experiment?.productId ?? defaultProductId ?? products[0]?.id}
              required
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Owner" htmlFor="x-owner">
            <Input id="x-owner" name="owner" defaultValue={experiment?.owner ?? ""} placeholder="Rao" required />
          </Field>
        </div>

        <Field label="Name" htmlFor="x-title">
          <Input
            id="x-title"
            name="title"
            defaultValue={experiment?.title}
            placeholder="Annual-first paywall ordering"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type" htmlFor="x-category">
            <NativeSelect
              id="x-category"
              name="category"
              value={category}
              onChange={(event) => {
                const next = event.target.value as ExperimentCategory;
                setCategory(next);
                chooseSurface(CATEGORY_SURFACES[next][0]);
              }}
            >
              {EXPERIMENT_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABEL[value]}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Surface" htmlFor="x-surface">
            <NativeSelect
              id="x-surface"
              name="surface"
              value={surface}
              onChange={(event) => chooseSurface(event.target.value as Surface)}
            >
              {CATEGORY_SURFACES[category].map((value) => (
                <option key={value} value={value}>
                  {SURFACE_LABEL[value]}
                </option>
              ))}
              <option value="OTHER">Other</option>
            </NativeSelect>
          </Field>

          <Field
            label="Health dimension"
            htmlFor="x-dimension"
            hint="Which of the four this is meant to move."
          >
            <NativeSelect
              id="x-dimension"
              name="dimension"
              value={dimension}
              onChange={(event) => setDimension(event.target.value as Dimension)}
            >
              {DIMENSIONS.map((value) => (
                <option key={value} value={value}>
                  {DIMENSION_LABEL[value]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Hypothesis</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            If an idea will not fit this sentence, it is a wish rather than a hypothesis.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Reads as</p>
          <p className="mt-1 text-sm leading-relaxed">
            {complete ? preview : <span className="text-muted-foreground">Fill the fields below and the sentence assembles here.</span>}
          </p>
        </div>

        <Field label="We believe changing..." htmlFor="x-change">
          <Input
            id="x-change"
            name="changeDescription"
            value={parts.changeDescription}
            onChange={update("changeDescription")}
            placeholder="leading the paywall with the annual plan"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="For..." htmlFor="x-audience">
            <Input
              id="x-audience"
              name="audience"
              value={parts.audience}
              onChange={update("audience")}
              placeholder="users who hit the third receipt scan"
              required
            />
          </Field>
          <Field label="Will move..." htmlFor="x-metric">
            <Input
              id="x-metric"
              name="expectedMetric"
              value={parts.expectedMetric}
              onChange={update("expectedMetric")}
              placeholder="trial start rate"
              required
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Direction" htmlFor="x-direction">
            <NativeSelect
              id="x-direction"
              name="expectedDirection"
              value={parts.expectedDirection}
              onChange={update("expectedDirection")}
            >
              <option value="UP">Up</option>
              <option value="DOWN">Down</option>
            </NativeSelect>
          </Field>
          <Field label="By how much" htmlFor="x-size">
            <Input
              id="x-size"
              name="expectedSize"
              value={parts.expectedSize}
              onChange={update("expectedSize")}
              placeholder="by 12%"
              required
            />
          </Field>
          <Field label="Within" htmlFor="x-timeframe">
            <Input
              id="x-timeframe"
              name="timeframe"
              value={parts.timeframe}
              onChange={update("timeframe")}
              placeholder="14 days"
              required
            />
          </Field>
        </div>

        <Field
          label="Because..."
          htmlFor="x-rationale"
          hint="The evidence. A funnel number, a competitor teardown, a previous result."
        >
          <Textarea
            id="x-rationale"
            name="rationale"
            value={parts.rationale}
            onChange={update("rationale")}
            rows={3}
            placeholder="three of four competitors lead with annual and our start rate is half the category median"
            required
          />
        </Field>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Measurement and stop rule</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Write the stop rule now. Deciding it after you have seen the chart is not a stop rule.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary metric" htmlFor="x-primary">
            <Input
              id="x-primary"
              name="primaryMetric"
              defaultValue={experiment?.primaryMetric}
              placeholder="Trial start rate"
              required
            />
          </Field>
          <Field label="Guardrail metric" htmlFor="x-guardrail" hint="What must not get worse.">
            <Input
              id="x-guardrail"
              name="guardrailMetric"
              defaultValue={experiment?.guardrailMetric ?? ""}
              placeholder="D7 retention"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Secondary metrics" htmlFor="x-secondary">
            <Input
              id="x-secondary"
              name="secondaryMetrics"
              defaultValue={experiment?.secondaryMetrics ?? ""}
              placeholder="Paywall view to purchase, ARPU"
            />
          </Field>
          <Field label="Minimum detectable effect" htmlFor="x-mde">
            <Input
              id="x-mde"
              name="minDetectableEffect"
              defaultValue={experiment?.minDetectableEffect ?? ""}
              placeholder="8% relative"
            />
          </Field>
        </div>

        <Field
          label="Kill criteria"
          htmlFor="x-kill"
          hint="The condition under which you stop early, agreed before launch."
        >
          <Textarea
            id="x-kill"
            name="killCriteria"
            rows={2}
            defaultValue={experiment?.killCriteria ?? ""}
            placeholder="Stop early if trial starts fall more than 5% or D7 drops below 14%."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stop date" htmlFor="x-stop">
            <Input
              id="x-stop"
              name="stopDate"
              type="date"
              defaultValue={toInputDate(experiment?.stopDate)}
            />
          </Field>
          <Field label="Minimum sample size" htmlFor="x-sample">
            <Input
              id="x-sample"
              name="minSampleSize"
              type="number"
              min={0}
              defaultValue={experiment?.minSampleSize ?? ""}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Variants" htmlFor="x-variants">
            <Input
              id="x-variants"
              name="variantSummary"
              defaultValue={experiment?.variantSummary ?? ""}
              placeholder="Control: monthly first. Variant: annual first."
            />
          </Field>
          <Field label="Link to what users saw" htmlFor="x-asset">
            <Input
              id="x-asset"
              name="assetUrl"
              type="url"
              defaultValue={experiment?.assetUrl ?? ""}
              placeholder="https://www.figma.com/file/..."
            />
          </Field>
        </div>
      </section>

      <div className="flex gap-2 border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : experiment ? "Save changes" : "Add to backlog"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
