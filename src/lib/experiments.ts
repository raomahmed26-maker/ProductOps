// Experiment rules: how an idea is scored, when it is allowed to launch, and
// how a finished run gets turned into a decision.

import type { Decision, Dimension, ExperimentStatus } from "./taxonomy";

export type ScorableExperiment = {
  iceImpact: number | null;
  iceConfidence: number | null;
  iceEase: number | null;
};

/** ICE, averaged to a 0-10 scale. Null until all three are scored. */
export function iceScore(experiment: ScorableExperiment): number | null {
  const { iceImpact, iceConfidence, iceEase } = experiment;
  if (iceImpact == null || iceConfidence == null || iceEase == null) return null;
  return Number(((iceImpact + iceConfidence + iceEase) / 3).toFixed(1));
}

export type LaunchGateInput = {
  changeDescription: string;
  audience: string;
  expectedMetric: string;
  rationale: string;
  primaryMetric: string;
  guardrailMetric: string | null;
  killCriteria: string | null;
  stopDate: Date | null;
  minSampleSize: number | null;
};

export type LaunchGateItem = { key: string; label: string; satisfied: boolean; why: string };

// Written before launch or not at all. Deciding the stop rule after seeing the
// chart wiggle is how teams talk themselves into a result.
export function launchGate(experiment: LaunchGateInput): LaunchGateItem[] {
  return [
    {
      key: "hypothesis",
      label: "Hypothesis is complete",
      satisfied: Boolean(
        experiment.changeDescription && experiment.audience && experiment.expectedMetric,
      ),
      why: "A change, an audience and an expected metric movement.",
    },
    {
      key: "rationale",
      label: "Evidence recorded",
      satisfied: Boolean(experiment.rationale?.trim()),
      why: "Why you believe this will work, so a future reader can judge the call.",
    },
    {
      key: "primary",
      label: "Primary metric named",
      satisfied: Boolean(experiment.primaryMetric?.trim()),
      why: "One metric decides the outcome.",
    },
    {
      key: "guardrail",
      label: "Guardrail metric named",
      satisfied: Boolean(experiment.guardrailMetric?.trim()),
      why: "What must not get worse while you chase the primary.",
    },
    {
      key: "kill",
      label: "Kill criteria pre-registered",
      satisfied: Boolean(experiment.killCriteria?.trim()),
      why: "The condition under which you stop, agreed before you start.",
    },
    {
      key: "stop",
      label: "Stop rule set",
      satisfied: Boolean(experiment.stopDate) || Boolean(experiment.minSampleSize),
      why: "A date or a sample size, so the run has an end.",
    },
  ];
}

export function canLaunch(experiment: LaunchGateInput): boolean {
  return launchGate(experiment).every((item) => item.satisfied);
}

export type HypothesisParts = {
  changeDescription: string;
  audience: string;
  expectedMetric: string;
  expectedDirection: string;
  expectedSize: string;
  timeframe: string;
  rationale: string;
};

/** The enforced sentence. If an idea will not fit it, it is a wish, not a hypothesis. */
export function hypothesisSentence(parts: HypothesisParts): string {
  const direction = parts.expectedDirection === "DOWN" ? "fall" : "rise";
  return `We believe ${parts.changeDescription} for ${parts.audience} will make ${parts.expectedMetric} ${direction} ${parts.expectedSize} within ${parts.timeframe}, because ${parts.rationale}`;
}

export const STATUS_ORDER: ExperimentStatus[] = [
  "BACKLOG",
  "SCORED",
  "READY",
  "RUNNING",
  "ANALYSIS",
  "DECIDED",
  "ARCHIVED",
];

export const DECISION_CLASS: Record<Decision, string> = {
  SHIP: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  ITERATE: "border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300",
  KILL: "border-rose-500/30 bg-rose-500/12 text-rose-700 dark:text-rose-300",
  INCONCLUSIVE: "border-border bg-muted text-muted-foreground",
};

export const EXPERIMENT_STATUS_CLASS: Record<ExperimentStatus, string> = {
  BACKLOG: "border-border bg-muted text-muted-foreground",
  SCORED: "border-border bg-muted text-muted-foreground",
  READY: "border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300",
  RUNNING: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  ANALYSIS: "border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  DECIDED: "border-border bg-muted text-muted-foreground",
  ARCHIVED: "border-border bg-muted text-muted-foreground/70",
};

/** A run that is past its own stop rule with no decision recorded. */
export function isOverdue(
  experiment: { status: string; stopDate: Date | null },
  now: Date = new Date(),
): boolean {
  return experiment.status === "RUNNING" && Boolean(experiment.stopDate) && experiment.stopDate! < now;
}

export function deltaVerdict(delta: number): "up" | "down" | "flat" {
  if (delta > 0.5) return "up";
  if (delta < -0.5) return "down";
  return "flat";
}

/** Which of the four health dimensions each surface usually moves, for defaults. */
export const SURFACE_DEFAULT_DIMENSION: Record<string, Dimension> = {
  PAYWALL: "MONETISATION",
  PRICING: "MONETISATION",
  ONBOARDING: "ACTIVATION",
  FEATURE: "RETENTION",
  UI_UX: "ACTIVATION",
  PRODUCT_HUNT: "ACQUISITION",
  REDDIT: "ACQUISITION",
  COMMUNITY: "ACQUISITION",
  GOOGLE_CPI: "ACQUISITION",
  REGIONAL: "ACQUISITION",
  AD_GROUP: "ACQUISITION",
  ASO: "ACQUISITION",
  OTHER: "RETENTION",
};
