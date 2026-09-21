"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/field";
import { saveQACycle } from "@/lib/actions";
import { QA_ISSUE_RATE_TARGET, QA_MIN_CYCLES, qaGateCleared } from "@/lib/status";
import { formatDate, toInputDate } from "@/lib/format";

export type QACycleRow = {
  id: string;
  cycleNumber: number;
  ranOn: Date;
  issuesFound: number;
  issuesFixed: number;
  issueRate: number;
  devIssues: number;
  designIssues: number;
  prdIssues: number;
  buildLabel: string | null;
  sheetUrl: string | null;
};

export function QAPanel({ stageId, cycles }: { stageId: string; cycles: QACycleRow[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const sorted = [...cycles].sort((a, b) => a.cycleNumber - b.cycleNumber);
  const latest = sorted.at(-1);
  const cleared = qaGateCleared(sorted);
  const maxRate = Math.max(QA_ISSUE_RATE_TARGET * 1.5, ...sorted.map((c) => c.issueRate));

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveQACycle(formData);
      if (result.ok) {
        toast.success("QA cycle recorded");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold tracking-tight">QA cycles</h4>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px]",
              cleared ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
            )}
          >
            {cleared
              ? "Gate cleared"
              : `Needs ${QA_MIN_CYCLES} cycles or under ${QA_ISSUE_RATE_TARGET}%`}
          </span>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" />
            Log cycle
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          No cycles logged. The first pass against a debug build usually finds the most.
        </p>
      ) : (
        <>
          <div className="relative mt-4 flex h-28 items-end gap-2 border-b border-border pb-0">
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-amber-500/60"
              style={{ bottom: `${(QA_ISSUE_RATE_TARGET / maxRate) * 100}%` }}
            >
              <span className="absolute -top-4 right-0 text-[10px] text-amber-600 dark:text-amber-400">
                {QA_ISSUE_RATE_TARGET}% target
              </span>
            </div>
            {sorted.map((cycle) => (
              <div key={cycle.id} className="group relative flex flex-1 flex-col items-center gap-1">
                <span className="numeric text-[10px] text-muted-foreground">
                  {cycle.issueRate.toFixed(1)}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t transition-colors",
                    cycle.issueRate < QA_ISSUE_RATE_TARGET
                      ? "bg-emerald-500/70"
                      : "bg-amber-500/70",
                  )}
                  style={{ height: `${Math.max(4, (cycle.issueRate / maxRate) * 78)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {sorted.map((cycle) => (
              <p key={cycle.id} className="flex-1 pt-1 text-center text-[10px] text-muted-foreground">
                C{cycle.cycleNumber}
              </p>
            ))}
          </div>

          <ul className="mt-3 divide-y divide-border rounded-lg border border-border text-xs">
            {[...sorted].reverse().map((cycle) => (
              <li key={cycle.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                <span className="font-medium">Cycle {cycle.cycleNumber}</span>
                <span className="text-muted-foreground">{formatDate(cycle.ranOn)}</span>
                {cycle.buildLabel ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    {cycle.buildLabel}
                  </span>
                ) : null}
                <span className="numeric text-muted-foreground">
                  {cycle.issuesFixed}/{cycle.issuesFound} fixed
                </span>
                <span className="text-muted-foreground">
                  {cycle.devIssues} dev · {cycle.designIssues} design · {cycle.prdIssues} PRD
                </span>
                <span
                  className={cn(
                    "numeric ml-auto font-medium",
                    cycle.issueRate < QA_ISSUE_RATE_TARGET
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {cycle.issueRate.toFixed(1)}%
                </span>
                {cycle.sheetUrl ? (
                  <a
                    href={cycle.sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Open QA sheet for cycle ${cycle.cycleNumber}`}
                  >
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>

          {latest && !cleared ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {latest.designIssues > 0
                ? `Cycle ${latest.cycleNumber} still carries ${latest.designIssues} design issues, which usually means the Figma file needs a revision rather than the build.`
                : `Cycle ${latest.cycleNumber} is at ${latest.issueRate.toFixed(1)}%. One more pass should clear it.`}
            </p>
          ) : null}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log a QA cycle</DialogTitle>
            <DialogDescription>
              Split the issues by cause — a rising design count is a signal about the handover, not
              the developer.
            </DialogDescription>
          </DialogHeader>

          <form action={submit} className="space-y-4">
            <input type="hidden" name="stageId" value={stageId} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cycle number" htmlFor="qa-cycle">
                <Input
                  id="qa-cycle"
                  name="cycleNumber"
                  type="number"
                  min={1}
                  defaultValue={(latest?.cycleNumber ?? 0) + 1}
                  required
                />
              </Field>
              <Field label="Date" htmlFor="qa-date">
                <Input
                  id="qa-date"
                  name="ranOn"
                  type="date"
                  defaultValue={toInputDate(new Date())}
                  required
                />
              </Field>
            </div>

            <Field label="Build" htmlFor="qa-build">
              <Input id="qa-build" name="buildLabel" placeholder="0.8.5" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Found" htmlFor="qa-found">
                <Input id="qa-found" name="issuesFound" type="number" min={0} defaultValue={0} required />
              </Field>
              <Field label="Fixed" htmlFor="qa-fixed">
                <Input id="qa-fixed" name="issuesFixed" type="number" min={0} defaultValue={0} required />
              </Field>
              <Field label="Issue rate %" htmlFor="qa-rate">
                <Input id="qa-rate" name="issueRate" type="number" step="0.1" min={0} max={100} required />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Dev" htmlFor="qa-dev">
                <Input id="qa-dev" name="devIssues" type="number" min={0} defaultValue={0} />
              </Field>
              <Field label="Design" htmlFor="qa-design">
                <Input id="qa-design" name="designIssues" type="number" min={0} defaultValue={0} />
              </Field>
              <Field label="PRD" htmlFor="qa-prd">
                <Input id="qa-prd" name="prdIssues" type="number" min={0} defaultValue={0} />
              </Field>
            </div>

            <Field label="Sheet link" htmlFor="qa-sheet">
              <Input id="qa-sheet" name="sheetUrl" type="url" placeholder="https://docs.google.com/spreadsheets/..." />
            </Field>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Record cycle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
