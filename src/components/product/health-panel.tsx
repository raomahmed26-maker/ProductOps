"use client";

import { useState, useTransition } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, Sliders, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/field";
import { importMetricsCsv, saveThresholds, saveWeeklyMetric } from "@/lib/actions";
import { KILL_WATCH_WEEKS } from "@/lib/status";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatShortDate,
  signed,
  toInputDate,
} from "@/lib/format";

export type MetricRow = {
  id: string;
  weekStart: Date;
  installs: number;
  activationRate: number;
  d1: number;
  d7: number;
  d30: number | null;
  revenue: number;
  payingUsers: number;
  source: string;
};

export type Thresholds = { minWeeklyInstalls: number; minD1: number; minD7: number };

export function HealthPanel({
  productId,
  metrics,
  thresholds,
}: {
  productId: string;
  metrics: MetricRow[];
  thresholds: Thresholds;
}) {
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [tuning, setTuning] = useState(false);

  const chronological = [...metrics].sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  const latest = chronological.at(-1);
  const previous = chronological.at(-2);

  if (!latest) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium">No weekly numbers yet</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Add the first week by hand, or paste a GA4 export. The keep-or-kill verdict needs at least
          one week of acquisition and retention.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button size="sm" onClick={() => setAdding(true)}>
            Add a week
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
            Paste GA4 export
          </Button>
        </div>
        <MetricDialog open={adding} onClose={() => setAdding(false)} productId={productId} />
        <ImportDialog open={importing} onClose={() => setImporting(false)} productId={productId} />
      </div>
    );
  }

  const failing: string[] = [];
  if (latest.installs < thresholds.minWeeklyInstalls) failing.push("Weekly installs");
  if (latest.d1 < thresholds.minD1) failing.push("D1 retention");
  if (latest.d7 < thresholds.minD7) failing.push("D7 retention");

  let weeksFailing = 0;
  for (const week of [...chronological].reverse()) {
    const fails =
      week.installs < thresholds.minWeeklyInstalls ||
      week.d1 < thresholds.minD1 ||
      week.d7 < thresholds.minD7;
    if (!fails) break;
    weeksFailing += 1;
  }

  const verdict =
    failing.length === 0
      ? { label: "Keep", tone: "good" as const, line: "Clears every threshold this week." }
      : weeksFailing >= KILL_WATCH_WEEKS
        ? {
            label: "Kill watch",
            tone: "bad" as const,
            line: `${failing.join(" and ")} under threshold for ${weeksFailing} consecutive weeks.`,
          }
        : {
            label: "Watch",
            tone: "warn" as const,
            line: `${failing.join(" and ")} under threshold this week.`,
          };

  const chartData = chronological.map((metric) => ({
    week: formatShortDate(metric.weekStart),
    installs: metric.installs,
    d1: metric.d1,
    d7: metric.d7,
  }));

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-4",
          verdict.tone === "good" && "border-emerald-500/30 bg-emerald-500/8",
          verdict.tone === "warn" && "border-amber-500/30 bg-amber-500/8",
          verdict.tone === "bad" && "border-rose-500/35 bg-rose-500/8",
        )}
      >
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              verdict.tone === "good" && "text-emerald-700 dark:text-emerald-300",
              verdict.tone === "warn" && "text-amber-700 dark:text-amber-300",
              verdict.tone === "bad" && "text-rose-700 dark:text-rose-300",
            )}
          >
            {verdict.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{verdict.line}</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setTuning(true)}>
          <Sliders className="size-3.5" />
          {formatNumber(thresholds.minWeeklyInstalls)} installs · D1 {thresholds.minD1}% · D7{" "}
          {thresholds.minD7}%
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Weekly installs"
          value={formatNumber(latest.installs)}
          delta={previous ? signed(latest.installs - previous.installs) : null}
          failing={failing.includes("Weekly installs")}
          target={`target ${formatNumber(thresholds.minWeeklyInstalls)}`}
        />
        <Stat
          label="Activation"
          value={formatPercent(latest.activationRate)}
          delta={previous ? `${signed(latest.activationRate - previous.activationRate, 1)}pt` : null}
        />
        <Stat
          label="D1 retention"
          value={formatPercent(latest.d1)}
          delta={previous ? `${signed(latest.d1 - previous.d1, 1)}pt` : null}
          failing={failing.includes("D1 retention")}
          target={`target ${thresholds.minD1}%`}
        />
        <Stat
          label="D7 retention"
          value={formatPercent(latest.d7)}
          delta={previous ? `${signed(latest.d7 - previous.d7, 1)}pt` : null}
          failing={failing.includes("D7 retention")}
          target={`target ${thresholds.minD7}%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Acquisition" subtitle="Weekly installs against the threshold">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelStyle={{ fontSize: 11 }}
              />
              <ReferenceLine
                y={thresholds.minWeeklyInstalls}
                stroke="currentColor"
                className="text-amber-500"
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="installs"
                name="Installs"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Retention" subtitle="D1 and D7 against their thresholds">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelStyle={{ fontSize: 11 }} />
              <ReferenceLine y={thresholds.minD1} stroke="currentColor" className="text-sky-500" strokeDasharray="4 4" />
              <ReferenceLine y={thresholds.minD7} stroke="currentColor" className="text-emerald-500" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="d1" name="D1" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="d7" name="D7" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-xs font-semibold tracking-tight">Weekly log</h4>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setImporting(true)}>
              <Upload className="size-3.5" />
              Paste export
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" />
              Add week
            </Button>
          </div>
        </div>

        <div className="mt-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Week</th>
                <th className="px-3 py-2 text-right font-medium">Installs</th>
                <th className="px-3 py-2 text-right font-medium">Activation</th>
                <th className="px-3 py-2 text-right font-medium">D1</th>
                <th className="px-3 py-2 text-right font-medium">D7</th>
                <th className="px-3 py-2 text-right font-medium">D30</th>
                <th className="px-3 py-2 text-right font-medium">Revenue</th>
                <th className="px-3 py-2 text-right font-medium">Payers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...chronological].reverse().map((metric) => (
                <tr key={metric.id}>
                  <td className="px-3 py-1.5 whitespace-nowrap">{formatShortDate(metric.weekStart)}</td>
                  <td
                    className={cn(
                      "numeric px-3 py-1.5 text-right",
                      metric.installs < thresholds.minWeeklyInstalls && "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {formatNumber(metric.installs)}
                  </td>
                  <td className="numeric px-3 py-1.5 text-right">{formatPercent(metric.activationRate)}</td>
                  <td
                    className={cn(
                      "numeric px-3 py-1.5 text-right",
                      metric.d1 < thresholds.minD1 && "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {formatPercent(metric.d1)}
                  </td>
                  <td
                    className={cn(
                      "numeric px-3 py-1.5 text-right",
                      metric.d7 < thresholds.minD7 && "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {formatPercent(metric.d7)}
                  </td>
                  <td className="numeric px-3 py-1.5 text-right text-muted-foreground">
                    {metric.d30 != null ? formatPercent(metric.d30) : "—"}
                  </td>
                  <td className="numeric px-3 py-1.5 text-right">{formatCurrency(metric.revenue)}</td>
                  <td className="numeric px-3 py-1.5 text-right text-muted-foreground">
                    {formatNumber(metric.payingUsers)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MetricDialog open={adding} onClose={() => setAdding(false)} productId={productId} />
      <ImportDialog open={importing} onClose={() => setImporting(false)} productId={productId} />
      <ThresholdDialog
        open={tuning}
        onClose={() => setTuning(false)}
        productId={productId}
        thresholds={thresholds}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  failing,
  target,
}: {
  label: string;
  value: string;
  delta?: string | null;
  failing?: boolean;
  target?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-4 py-3",
        failing ? "border-rose-500/30" : "border-border",
      )}
    >
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "numeric mt-1 text-xl font-semibold tracking-tight",
          failing && "text-rose-600 dark:text-rose-400",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {delta ? <span className="mr-1.5">{delta} w/w</span> : null}
        {target}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="text-xs font-semibold tracking-tight">{title}</h4>
      <p className="mt-0.5 mb-3 text-[11px] text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}

function MetricDialog({
  open,
  onClose,
  productId,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
}) {
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveWeeklyMetric(formData);
      if (result.ok) {
        toast.success("Week recorded");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a week</DialogTitle>
          <DialogDescription>
            Monday-start weeks. Re-entering an existing week overwrites it.
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />

          <Field label="Week starting" htmlFor="m-week">
            <Input id="m-week" name="weekStart" type="date" defaultValue={toInputDate(new Date())} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Installs" htmlFor="m-installs">
              <Input id="m-installs" name="installs" type="number" min={0} required />
            </Field>
            <Field label="Activation %" htmlFor="m-activation">
              <Input id="m-activation" name="activationRate" type="number" step="0.1" min={0} max={100} required />
            </Field>
            <Field label="D1 %" htmlFor="m-d1">
              <Input id="m-d1" name="d1" type="number" step="0.1" min={0} max={100} required />
            </Field>
            <Field label="D7 %" htmlFor="m-d7">
              <Input id="m-d7" name="d7" type="number" step="0.1" min={0} max={100} required />
            </Field>
            <Field label="D30 %" htmlFor="m-d30">
              <Input id="m-d30" name="d30" type="number" step="0.1" min={0} max={100} />
            </Field>
            <Field label="Revenue" htmlFor="m-revenue">
              <Input id="m-revenue" name="revenue" type="number" step="0.01" min={0} defaultValue={0} />
            </Field>
          </div>

          <Field label="Paying users" htmlFor="m-payers">
            <Input id="m-payers" name="payingUsers" type="number" min={0} defaultValue={0} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Record week"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({
  open,
  onClose,
  productId,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
}) {
  const [csv, setCsv] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await importMetricsCsv(productId, csv);
      if (result.ok) {
        toast.success("Weeks imported");
        setCsv("");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paste a GA4 export</DialogTitle>
          <DialogDescription>
            One week per line, comma or tab separated: week start, installs, activation %, D1 %, D7 %,
            D30 %, revenue, paying users.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          rows={8}
          className="font-mono text-xs"
          placeholder={"2026-09-07, 1840, 61.2, 58.4, 19.1, 9.2, 2140, 96\n2026-08-31, 1760, 60.4, 57.9, 18.4, 8.9, 1985, 89"}
        />

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || csv.trim() === ""}>
            {pending ? "Importing..." : "Import weeks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThresholdDialog({
  open,
  onClose,
  productId,
  thresholds,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  thresholds: Thresholds;
}) {
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveThresholds(formData);
      if (result.ok) {
        toast.success("Thresholds updated");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Keep-or-kill thresholds</DialogTitle>
          <DialogDescription>
            The two numbers that decide whether this app survives. Portfolio default is 1000 weekly
            installs with D1 at 55% and D7 at 15%.
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />
          <Field label="Minimum weekly installs" htmlFor="t-installs">
            <Input
              id="t-installs"
              name="minWeeklyInstalls"
              type="number"
              min={0}
              defaultValue={thresholds.minWeeklyInstalls}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum D1 %" htmlFor="t-d1">
              <Input id="t-d1" name="minD1" type="number" step="0.1" min={0} max={100} defaultValue={thresholds.minD1} />
            </Field>
            <Field label="Minimum D7 %" htmlFor="t-d7">
              <Input id="t-d7" name="minD7" type="number" step="0.1" min={0} max={100} defaultValue={thresholds.minD7} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save thresholds"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
