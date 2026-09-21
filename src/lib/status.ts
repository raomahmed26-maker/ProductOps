// Status is derived, never asserted.
//
// The failure mode this guards against: a product stays "green" because its owner
// set it green in March and has not opened the record since. Everything below is
// computed from evidence — artifact timestamps, stage age against your own
// cadence, QA issue rates, and live metrics against the kill thresholds.
//
// classify() is the only place status is decided. If you want to argue with the
// rules, argue with this function.

import { GATE_SPEC, type DocStatus, type Gate, type Phase } from "./taxonomy";

/** A stage with no movement for this long is not "in progress", it is stalled. */
export const STALL_THRESHOLD_DAYS = 14;
/** Beyond this, nobody is asking about it at all. */
export const ABANDONED_THRESHOLD_DAYS = 30;
/** The QA gate clears below this issue rate. */
export const QA_ISSUE_RATE_TARGET = 10;
/** Your cadence is at least five cycles before shipping. */
export const QA_MIN_CYCLES = 5;
/** How many consecutive weeks under threshold before a live app is on kill watch. */
export const KILL_WATCH_WEEKS = 2;

export const STATUSES = [
  "HEALTHY",
  "ON_TRACK",
  "AT_RISK",
  "BLOCKED",
  "STALLED",
  "KILL_WATCH",
] as const;
export type DerivedStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<DerivedStatus, string> = {
  HEALTHY: "Healthy",
  ON_TRACK: "On track",
  AT_RISK: "At risk",
  BLOCKED: "Blocked",
  STALLED: "Stalled",
  KILL_WATCH: "Kill watch",
};

/** Colour is an exception cue here, not decoration. Good news stays quiet. */
export const STATUS_CLASS: Record<DerivedStatus, string> = {
  HEALTHY: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ON_TRACK: "border-border bg-muted text-muted-foreground",
  AT_RISK: "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  BLOCKED: "border-rose-500/35 bg-rose-500/12 text-rose-700 dark:text-rose-300",
  STALLED: "border-rose-500/45 bg-rose-500/15 text-rose-700 dark:text-rose-300",
  KILL_WATCH: "border-rose-500/45 bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export const STATUS_DOT: Record<DerivedStatus, string> = {
  HEALTHY: "bg-emerald-500",
  ON_TRACK: "bg-muted-foreground/40",
  AT_RISK: "bg-amber-500",
  BLOCKED: "bg-rose-500",
  STALLED: "bg-rose-600",
  KILL_WATCH: "bg-rose-600",
};

/** Severity order, used to sort the attention feed and pick a product's worst signal. */
export const STATUS_SEVERITY: Record<DerivedStatus, number> = {
  HEALTHY: 0,
  ON_TRACK: 1,
  AT_RISK: 2,
  BLOCKED: 3,
  KILL_WATCH: 4,
  STALLED: 5,
};

export type StatusInput = {
  phase: Phase;
  currentGate: Gate;
  minWeeklyInstalls: number;
  minD1: number;
  minD7: number;
  stages: {
    gate: Gate;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    expectedDays: number;
    blockedReason: string | null;
    updatedAt: Date;
    documents: { docType: string; status: string; updatedAt: Date }[];
    qaCycles: { cycleNumber: number; issueRate: number; ranOn: Date }[];
  }[];
  submissions: {
    platform: string;
    status: string;
    submittedAt: Date;
    rejectionReason: string | null;
    updatedAt: Date;
  }[];
  metrics: {
    weekStart: Date;
    installs: number;
    d1: number;
    d7: number;
    activationRate: number;
    revenue: number;
  }[];
};

export type StatusReason = {
  status: DerivedStatus;
  /** One line, written to be read in a governance meeting. */
  message: string;
};

export type ProductStatus = {
  status: DerivedStatus;
  /** Every rule that fired, worst first. */
  reasons: StatusReason[];
  daysSinceActivity: number;
  lastActivityAt: Date;
  /** Days the current gate has been open, against its expected duration. */
  gateAgeDays: number | null;
  gateExpectedDays: number;
  gateOverrunDays: number;
  nextAction: string;
};

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

/** The most recent evidence of anyone touching this product, across every artifact. */
export function lastActivity(input: StatusInput): Date {
  const candidates: Date[] = [];
  for (const stage of input.stages) {
    candidates.push(stage.updatedAt);
    if (stage.completedAt) candidates.push(stage.completedAt);
    for (const doc of stage.documents) candidates.push(doc.updatedAt);
    for (const cycle of stage.qaCycles) candidates.push(cycle.ranOn);
  }
  for (const submission of input.submissions) candidates.push(submission.updatedAt);
  for (const metric of input.metrics) candidates.push(metric.weekStart);
  if (candidates.length === 0) return new Date(0);
  return candidates.reduce((latest, date) => (date > latest ? date : latest));
}

function currentStage(input: StatusInput) {
  return input.stages.find((stage) => stage.gate === input.currentGate);
}

/** A gate cannot close while a required artifact is missing or unapproved. */
export function gateChecklist(
  gate: Gate,
  documents: { docType: string; status: string }[],
): { docType: string; present: boolean; approved: boolean }[] {
  return GATE_SPEC[gate].requiredDocTypes.map((docType) => {
    const matches = documents.filter((doc) => doc.docType === docType);
    return {
      docType,
      present: matches.length > 0,
      approved: matches.some((doc) => (doc.status as DocStatus) === "APPROVED"),
    };
  });
}

export function qaGateCleared(cycles: { cycleNumber: number; issueRate: number }[]): boolean {
  if (cycles.length === 0) return false;
  const latest = [...cycles].sort((a, b) => b.cycleNumber - a.cycleNumber)[0];
  return cycles.length >= QA_MIN_CYCLES || latest.issueRate < QA_ISSUE_RATE_TARGET;
}

export function classify(input: StatusInput, now: Date = new Date()): ProductStatus {
  const reasons: StatusReason[] = [];
  const activityAt = lastActivity(input);
  const daysSinceActivity = daysBetween(activityAt, now);
  const stage = currentStage(input);
  const gateExpectedDays = stage?.expectedDays ?? GATE_SPEC[input.currentGate].expectedDays;
  const gateAgeDays = stage?.startedAt ? daysBetween(stage.startedAt, now) : null;
  const gateOverrunDays = gateAgeDays === null ? 0 : Math.max(0, gateAgeDays - gateExpectedDays);

  // Stalled — no evidence of movement, whatever the owner last claimed.
  if (daysSinceActivity >= ABANDONED_THRESHOLD_DAYS) {
    reasons.push({
      status: "STALLED",
      message: `Nothing has moved for ${daysSinceActivity} days. Nobody is asking about this.`,
    });
  } else if (daysSinceActivity >= STALL_THRESHOLD_DAYS) {
    reasons.push({
      status: "STALLED",
      message: `No artifact touched in ${daysSinceActivity} days, past the ${STALL_THRESHOLD_DAYS}-day stall line.`,
    });
  }

  // Blocked — explicitly, by a person or by a store.
  if (stage?.blockedReason) {
    reasons.push({ status: "BLOCKED", message: stage.blockedReason });
  }
  const openRejection = input.submissions.find((s) => s.status === "REJECTED");
  if (openRejection) {
    reasons.push({
      status: "BLOCKED",
      message: `Rejected by ${openRejection.platform === "APP_STORE" ? "the App Store" : "the Play Store"} and not yet resubmitted.`,
    });
  }

  // At risk — running past your own cadence for this gate.
  if (gateOverrunDays > 0 && stage?.status !== "COMPLETE") {
    reasons.push({
      status: "AT_RISK",
      message: `${GATE_SPEC[input.currentGate].label} is ${gateOverrunDays} days over its ${gateExpectedDays}-day window.`,
    });
  }

  // At risk — QA not converging.
  const qaStage = input.stages.find((s) => s.gate === "QA");
  if (qaStage && qaStage.qaCycles.length > 0) {
    const cycles = [...qaStage.qaCycles].sort((a, b) => b.cycleNumber - a.cycleNumber);
    const latest = cycles[0];
    if (latest.issueRate >= QA_ISSUE_RATE_TARGET && cycles.length >= QA_MIN_CYCLES) {
      reasons.push({
        status: "AT_RISK",
        message: `Issue rate still ${latest.issueRate.toFixed(1)}% after ${cycles.length} QA cycles.`,
      });
    }
  }

  // At risk — a required artifact is missing at the open gate.
  if (stage && stage.status !== "NOT_STARTED") {
    const missing = gateChecklist(input.currentGate, stage.documents).filter((item) => !item.present);
    if (missing.length > 0 && gateAgeDays !== null && gateAgeDays > gateExpectedDays / 2) {
      reasons.push({
        status: "AT_RISK",
        message: `${missing.length} required document${missing.length > 1 ? "s" : ""} still missing at this gate.`,
      });
    }
  }

  // Kill watch — the two metrics that decide whether a live app survives.
  const health = liveHealth(input);
  if (health) {
    if (health.weeksFailing >= KILL_WATCH_WEEKS) {
      reasons.push({
        status: "KILL_WATCH",
        message: `${health.failing.join(", ")} below threshold for ${health.weeksFailing} consecutive weeks.`,
      });
    } else if (health.failing.length > 0) {
      reasons.push({
        status: "AT_RISK",
        message: `${health.failing.join(", ")} under threshold this week.`,
      });
    }
  }

  reasons.sort((a, b) => STATUS_SEVERITY[b.status] - STATUS_SEVERITY[a.status]);

  const status: DerivedStatus =
    reasons[0]?.status ??
    (input.phase === "POST_PRODUCTION" && health && health.failing.length === 0
      ? "HEALTHY"
      : "ON_TRACK");

  return {
    status,
    reasons,
    daysSinceActivity,
    lastActivityAt: activityAt,
    gateAgeDays,
    gateExpectedDays,
    gateOverrunDays,
    nextAction: nextAction(input, stage, health),
  };
}

export type LiveHealth = {
  latest: StatusInput["metrics"][number];
  previous?: StatusInput["metrics"][number];
  failing: string[];
  weeksFailing: number;
  installsDelta: number | null;
  d1Delta: number | null;
  d7Delta: number | null;
};

/** Weekly health against the thresholds that decide keep or kill. */
export function liveHealth(input: StatusInput): LiveHealth | null {
  if (input.metrics.length === 0) return null;
  const sorted = [...input.metrics].sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  const latest = sorted[0];
  const previous = sorted[1];

  const failing: string[] = [];
  if (latest.installs < input.minWeeklyInstalls) failing.push("Weekly installs");
  if (latest.d1 < input.minD1) failing.push("D1 retention");
  if (latest.d7 < input.minD7) failing.push("D7 retention");

  let weeksFailing = 0;
  for (const week of sorted) {
    const fails =
      week.installs < input.minWeeklyInstalls ||
      week.d1 < input.minD1 ||
      week.d7 < input.minD7;
    if (!fails) break;
    weeksFailing += 1;
  }

  return {
    latest,
    previous,
    failing,
    weeksFailing,
    installsDelta: previous ? latest.installs - previous.installs : null,
    d1Delta: previous ? latest.d1 - previous.d1 : null,
    d7Delta: previous ? latest.d7 - previous.d7 : null,
  };
}

function nextAction(
  input: StatusInput,
  stage: StatusInput["stages"][number] | undefined,
  health: LiveHealth | null,
): string {
  if (stage?.blockedReason) return `Unblock: ${stage.blockedReason}`;

  const rejected = input.submissions.find((s) => s.status === "REJECTED");
  if (rejected) return "Rework the rejection and resubmit";

  if (input.currentGate === "LIVE" && health) {
    if (health.failing.includes("D1 retention")) return "First-run experience is leaking users";
    if (health.failing.includes("D7 retention")) return "Find the return reason and test it";
    if (health.failing.includes("Weekly installs")) return "Acquisition is under target — test a channel";
    return "Weekly review and pick the next experiment";
  }

  if (input.currentGate === "QA" && stage) {
    const cycles = [...stage.qaCycles].sort((a, b) => b.cycleNumber - a.cycleNumber);
    if (cycles.length === 0) return "Run QA cycle 1 against the debug build";
    if (!qaGateCleared(cycles)) return `Run QA cycle ${cycles.length + 1}`;
    return "QA gate cleared — prepare store submission";
  }

  if (stage) {
    const missing = gateChecklist(input.currentGate, stage.documents).filter((i) => !i.present);
    if (missing.length > 0) return `Add the missing ${GATE_SPEC[input.currentGate].short.toLowerCase()} documents`;
    const unapproved = gateChecklist(input.currentGate, stage.documents).filter((i) => !i.approved);
    if (unapproved.length > 0) return `Get sign-off on ${unapproved.length} document${unapproved.length > 1 ? "s" : ""}`;
    return `Close the ${GATE_SPEC[input.currentGate].label.toLowerCase()} gate`;
  }

  return `Start ${GATE_SPEC[input.currentGate].label.toLowerCase()}`;
}

/** Progress through the eight gates, for the pipeline rail. */
export function gateProgress(stages: { gate: Gate; status: string }[]): number {
  const complete = stages.filter((s) => s.status === "COMPLETE").length;
  return Math.round((complete / 8) * 100);
}
