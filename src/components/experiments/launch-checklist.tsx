"use client";

import { useTransition } from "react";
import { Check, Minus, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { launchGate, type LaunchGateInput } from "@/lib/experiments";
import { setExperimentStatus } from "@/lib/actions";
import type { ExperimentStatus } from "@/lib/taxonomy";

/**
 * Nothing runs until the plan is complete. The stop rule in particular has to be
 * written before launch — deciding it afterwards is how a chart wiggle becomes
 * a "result".
 */
export function LaunchChecklist({
  experimentId,
  experiment,
  status,
}: {
  experimentId: string;
  experiment: LaunchGateInput;
  status: ExperimentStatus;
}) {
  const [pending, startTransition] = useTransition();
  const items = launchGate(experiment);
  const ready = items.every((item) => item.satisfied);

  function advance(next: ExperimentStatus) {
    startTransition(async () => {
      const result = await setExperimentStatus(experimentId, next);
      toast[result.ok ? "success" : "error"](
        result.ok ? `Moved to ${next.toLowerCase()}` : result.error,
      );
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight">Launch checklist</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {ready
            ? "Everything is pre-registered. This experiment can run."
            : "Complete these before the experiment is allowed to start."}
        </p>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-3 px-5 py-2.5">
            {item.satisfied ? (
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
            )}
            <div>
              <p className={cn("text-sm", !item.satisfied && "text-muted-foreground")}>
                {item.label}
              </p>
              <p className="text-[11px] text-muted-foreground">{item.why}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
        {["BACKLOG", "SCORED", "READY"].includes(status) ? (
          <Button size="sm" disabled={!ready || pending} onClick={() => advance("RUNNING")}>
            <Play className="size-3.5" />
            Start the run
          </Button>
        ) : null}
        {status === "RUNNING" ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => advance("ANALYSIS")}>
            Stop and analyse
          </Button>
        ) : null}
        {status === "ANALYSIS" ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => advance("RUNNING")}>
            Resume the run
          </Button>
        ) : null}
        {status === "DECIDED" ? (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => advance("ARCHIVED")}>
            Archive
          </Button>
        ) : null}
      </div>
    </section>
  );
}
