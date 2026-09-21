"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect } from "@/components/forms/field";
import { createChildExperiment, recordResult } from "@/lib/actions";
import { DECISIONS, DECISION_LABEL, type Decision } from "@/lib/taxonomy";
import { DECISION_CLASS } from "@/lib/experiments";
import { formatDate } from "@/lib/format";

export type ResultRow = {
  baselineValue: number;
  observedValue: number;
  deltaPercent: number;
  sampleSize: number | null;
  guardrailBreached: boolean;
  decision: string;
  learning: string;
  recordedAt: Date;
};

export function ResultRecorder({
  experimentId,
  primaryMetric,
  result,
  followUps,
}: {
  experimentId: string;
  primaryMetric: string;
  result: ResultRow | null;
  followUps: { refId: string; title: string; status: string }[];
}) {
  const [editing, setEditing] = useState(result === null);
  const [pending, startTransition] = useTransition();
  const [childTitle, setChildTitle] = useState("");

  function submit(formData: FormData) {
    startTransition(async () => {
      const outcome = await recordResult(formData);
      if (outcome.ok) {
        toast.success("Result recorded");
        setEditing(false);
      } else {
        toast.error(outcome.error);
      }
    });
  }

  function addChild() {
    startTransition(async () => {
      const outcome = await createChildExperiment(experimentId, childTitle);
      if (outcome.ok) {
        toast.success(`${outcome.refId} added to the backlog`);
        setChildTitle("");
      } else {
        toast.error(outcome.error);
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Result and decision</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ship, iterate or kill. &ldquo;Interesting&rdquo; is not a decision.
          </p>
        </div>
        {result && !editing ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : null}
      </div>

      {result && !editing ? (
        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <Readout label="Baseline" value={String(result.baselineValue)} />
            <Readout label="Observed" value={String(result.observedValue)} />
            <Readout
              label="Change"
              value={`${result.deltaPercent > 0 ? "+" : ""}${result.deltaPercent}%`}
              tone={result.deltaPercent > 0 ? "good" : result.deltaPercent < 0 ? "bad" : undefined}
            />
            <Readout
              label="Sample"
              value={result.sampleSize ? result.sampleSize.toLocaleString() : "—"}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                DECISION_CLASS[result.decision as Decision],
              )}
            >
              {DECISION_LABEL[result.decision as Decision]}
            </span>
            {result.guardrailBreached ? (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/12 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300">
                Guardrail breached
              </span>
            ) : null}
            <span className="text-[11px] text-muted-foreground">
              recorded {formatDate(result.recordedAt)}
            </span>
          </div>

          <div>
            <p className="eyebrow">What we learned</p>
            <p className="mt-1 text-sm leading-relaxed">{result.learning}</p>
          </div>

          <div className="border-t border-border pt-4">
            <p className="eyebrow">Follow-ups</p>
            {followUps.length > 0 ? (
              <ul className="mt-1.5 space-y-1">
                {followUps.map((child) => (
                  <li key={child.refId} className="text-xs">
                    <a href={`/experiments/${child.refId}`} className="hover:underline">
                      <span className="font-mono text-muted-foreground">{child.refId}</span>{" "}
                      {child.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                A finished experiment is the best source of the next one.
              </p>
            )}

            <div className="mt-3 flex gap-2">
              <Input
                value={childTitle}
                onChange={(event) => setChildTitle(event.target.value)}
                placeholder="Next thing this result suggests testing"
                className="h-8 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={pending || childTitle.trim() === ""}
                onClick={addChild}
              >
                Queue it
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form action={submit} className="space-y-4 px-5 py-4">
          <input type="hidden" name="experimentId" value={experimentId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Baseline ${primaryMetric.toLowerCase()}`} htmlFor="r-baseline">
              <Input
                id="r-baseline"
                name="baselineValue"
                type="number"
                step="any"
                defaultValue={result?.baselineValue}
                required
              />
            </Field>
            <Field label="Observed" htmlFor="r-observed">
              <Input
                id="r-observed"
                name="observedValue"
                type="number"
                step="any"
                defaultValue={result?.observedValue}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sample size" htmlFor="r-sample">
              <Input
                id="r-sample"
                name="sampleSize"
                type="number"
                min={0}
                defaultValue={result?.sampleSize ?? ""}
              />
            </Field>
            <Field label="Decision" htmlFor="r-decision">
              <NativeSelect id="r-decision" name="decision" defaultValue={result?.decision ?? "ITERATE"}>
                {DECISIONS.map((decision) => (
                  <option key={decision} value={decision}>
                    {DECISION_LABEL[decision]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              name="guardrailBreached"
              defaultChecked={result?.guardrailBreached}
              className="size-3.5 rounded border-input"
            />
            The guardrail metric got worse
          </label>

          <Field
            label="What we learned"
            htmlFor="r-learning"
            hint="Write it for someone reading this in a year with no memory of the run."
          >
            <Textarea id="r-learning" name="learning" rows={4} defaultValue={result?.learning} required />
          </Field>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving..." : "Record decision"}
            </Button>
            {result ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      )}
    </section>
  );
}

function Readout({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "numeric mt-0.5 text-lg font-semibold tracking-tight",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
          tone === "bad" && "text-rose-600 dark:text-rose-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}
