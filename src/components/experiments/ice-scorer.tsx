"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { scoreExperiment } from "@/lib/actions";

const DIMENSIONS = [
  { key: "impact" as const, label: "Impact", hint: "How far will this move the metric if it works?" },
  { key: "confidence" as const, label: "Confidence", hint: "How strong is the evidence behind it?" },
  { key: "ease" as const, label: "Ease", hint: "How little effort does it take to ship?" },
];

export function IceScorer({
  experimentId,
  initial,
}: {
  experimentId: string;
  initial: { impact: number | null; confidence: number | null; ease: number | null };
}) {
  const [scores, setScores] = useState({
    impact: initial.impact ?? 5,
    confidence: initial.confidence ?? 5,
    ease: initial.ease ?? 5,
  });
  const [pending, startTransition] = useTransition();
  const unscored = initial.impact == null;
  const average = ((scores.impact + scores.confidence + scores.ease) / 3).toFixed(1);

  function save() {
    startTransition(async () => {
      const result = await scoreExperiment(experimentId, scores);
      toast[result.ok ? "success" : "error"](result.ok ? "Score saved" : result.error);
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-baseline justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">ICE score</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {unscored ? "Not scored yet." : "Rescore whenever the evidence changes."}
          </p>
        </div>
        <p className="numeric text-2xl font-semibold tracking-tight">{average}</p>
      </div>

      <div className="space-y-4 px-5 py-4">
        {DIMENSIONS.map((dimension) => (
          <div key={dimension.key}>
            <div className="flex items-baseline justify-between">
              <label htmlFor={`ice-${dimension.key}`} className="text-xs font-medium">
                {dimension.label}
              </label>
              <span className="numeric text-xs text-muted-foreground">{scores[dimension.key]}</span>
            </div>
            <div className="mt-1.5 flex gap-1">
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${dimension.label} ${value}`}
                  onClick={() => setScores((prev) => ({ ...prev, [dimension.key]: value }))}
                  className={cn(
                    "h-6 flex-1 rounded-sm text-[10px] transition-colors",
                    value <= scores[dimension.key]
                      ? "bg-foreground/75 text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted-foreground/25",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{dimension.hint}</p>
          </div>
        ))}

        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving..." : unscored ? "Save score" : "Update score"}
        </Button>
      </div>
    </section>
  );
}
