"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "./db";
import {
  DOC_STATUSES,
  DOC_TYPES,
  DECISIONS,
  DIMENSIONS,
  EXPERIMENT_CATEGORIES,
  EXPERIMENT_STATUSES,
  GATES,
  GATE_PHASE,
  PLATFORMS,
  REJECTION_REASONS,
  STAGE_STATUSES,
  SUBMISSION_STATUSES,
  SURFACES,
} from "./taxonomy";
import { canLaunch } from "./experiments";

export type ActionResult = { ok: true } | { ok: false; error: string };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function revalidateProduct(slug?: string) {
  revalidatePath("/");
  revalidatePath("/experiments");
  if (slug) revalidatePath(`/products/${slug}`);
}

/** Touching any artifact counts as activity, which is what keeps status honest. */
async function touchProduct(productId: string) {
  await db.product.update({ where: { id: productId }, data: { updatedAt: new Date() } });
}

// ---------------------------------------------------------------- documents

const documentSchema = z.object({
  stageId: z.string().min(1),
  title: z.string().min(1, "Give the document a title"),
  docType: z.enum(DOC_TYPES),
  url: z.string().url("Paste the full link to the document"),
  owner: z.string().min(1, "Who owns this?"),
  status: z.enum(DOC_STATUSES),
  version: z.string().default("v1"),
  summary: z.string().optional(),
});

export async function saveDocument(
  documentId: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = documentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const data = parsed.data;
  const stage = await db.stage.findUnique({
    where: { id: data.stageId },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!stage) return fail("That stage no longer exists");

  if (documentId) {
    await db.documentLink.update({ where: { id: documentId }, data });
  } else {
    await db.documentLink.create({ data });
  }
  await touchProduct(stage.product.id);
  revalidateProduct(stage.product.slug);
  return { ok: true };
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const doc = await db.documentLink.findUnique({
    where: { id: documentId },
    include: { stage: { include: { product: { select: { slug: true } } } } },
  });
  if (!doc) return fail("Already gone");
  await db.documentLink.delete({ where: { id: documentId } });
  revalidateProduct(doc.stage.product.slug);
  return { ok: true };
}

// ------------------------------------------------------------------- stages

const stageSchema = z.object({
  stageId: z.string().min(1),
  status: z.enum(STAGE_STATUSES),
  owner: z.string().optional(),
  blockedReason: z.string().optional(),
  notes: z.string().optional(),
  expectedDays: z.coerce.number().int().min(1).max(120),
});

export async function saveStage(formData: FormData): Promise<ActionResult> {
  const parsed = stageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { stageId, status, owner, blockedReason, notes, expectedDays } = parsed.data;

  const stage = await db.stage.findUnique({
    where: { id: stageId },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!stage) return fail("That stage no longer exists");

  const now = new Date();
  await db.stage.update({
    where: { id: stageId },
    data: {
      status,
      owner: owner || null,
      blockedReason: status === "BLOCKED" ? blockedReason || "Blocked" : null,
      notes: notes || null,
      expectedDays,
      startedAt: status !== "NOT_STARTED" ? (stage.startedAt ?? now) : null,
      completedAt: status === "COMPLETE" ? (stage.completedAt ?? now) : null,
    },
  });

  // Completing a gate moves the product to the next open one, so the pipeline
  // position is a consequence of the work rather than a separate thing to update.
  if (status === "COMPLETE") {
    const stages = await db.stage.findMany({ where: { productId: stage.productId } });
    const next = GATES.find((gate) => {
      const candidate = stages.find((s) => s.gate === gate);
      return candidate && candidate.id !== stageId && candidate.status !== "COMPLETE";
    });
    if (next) {
      await db.product.update({
        where: { id: stage.productId },
        data: { currentGate: next, phase: GATE_PHASE[next] },
      });
    }
  } else {
    await db.product.update({
      where: { id: stage.productId },
      data: { currentGate: stage.gate, phase: GATE_PHASE[stage.gate as (typeof GATES)[number]] },
    });
  }

  revalidateProduct(stage.product.slug);
  return { ok: true };
}

// ---------------------------------------------------------------- QA cycles

const qaSchema = z.object({
  stageId: z.string().min(1),
  cycleNumber: z.coerce.number().int().min(1),
  ranOn: z.string().min(1),
  issuesFound: z.coerce.number().int().min(0),
  issuesFixed: z.coerce.number().int().min(0),
  issueRate: z.coerce.number().min(0).max(100),
  devIssues: z.coerce.number().int().min(0).default(0),
  designIssues: z.coerce.number().int().min(0).default(0),
  prdIssues: z.coerce.number().int().min(0).default(0),
  buildLabel: z.string().optional(),
  sheetUrl: z.string().url().optional().or(z.literal("")),
});

export async function saveQACycle(formData: FormData): Promise<ActionResult> {
  const parsed = qaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { stageId, ranOn, sheetUrl, ...rest } = parsed.data;

  const stage = await db.stage.findUnique({
    where: { id: stageId },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!stage) return fail("That stage no longer exists");

  await db.qACycle.upsert({
    where: { stageId_cycleNumber: { stageId, cycleNumber: rest.cycleNumber } },
    update: { ...rest, ranOn: new Date(ranOn), sheetUrl: sheetUrl || null },
    create: { ...rest, stageId, ranOn: new Date(ranOn), sheetUrl: sheetUrl || null },
  });
  await touchProduct(stage.product.id);
  revalidateProduct(stage.product.slug);
  return { ok: true };
}

// --------------------------------------------------------------- submissions

const submissionSchema = z.object({
  productId: z.string().min(1),
  platform: z.enum(PLATFORMS),
  versionLabel: z.string().min(1, "Which version?"),
  submittedAt: z.string().min(1),
  status: z.enum(SUBMISSION_STATUSES),
  rejectionReason: z.enum(REJECTION_REASONS).optional().or(z.literal("")),
  rejectionNotes: z.string().optional(),
});

export async function saveSubmission(
  submissionId: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = submissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { productId, submittedAt, rejectionReason, rejectionNotes, ...rest } = parsed.data;

  if (rest.status === "REJECTED" && !rejectionReason) {
    return fail("Pick a rejection reason — that is how recurring causes surface");
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return fail("Unknown product");

  const data = {
    ...rest,
    productId,
    submittedAt: new Date(submittedAt),
    rejectionReason: rest.status === "REJECTED" ? (rejectionReason as string) : null,
    rejectionNotes: rest.status === "REJECTED" ? rejectionNotes || null : null,
    decidedAt: ["APPROVED", "REJECTED", "LIVE"].includes(rest.status) ? new Date() : null,
  };

  if (submissionId) {
    await db.storeSubmission.update({ where: { id: submissionId }, data });
  } else {
    await db.storeSubmission.create({ data });
  }
  revalidateProduct(product.slug);
  return { ok: true };
}

// ------------------------------------------------------------------ metrics

const metricSchema = z.object({
  productId: z.string().min(1),
  weekStart: z.string().min(1),
  installs: z.coerce.number().int().min(0),
  activationRate: z.coerce.number().min(0).max(100),
  d1: z.coerce.number().min(0).max(100),
  d7: z.coerce.number().min(0).max(100),
  d30: z.coerce.number().min(0).max(100).optional(),
  revenue: z.coerce.number().min(0).default(0),
  payingUsers: z.coerce.number().int().min(0).default(0),
  source: z.string().default("GA4"),
});

export async function saveWeeklyMetric(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  if (raw.d30 === "") delete raw.d30;
  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { productId, weekStart, ...rest } = parsed.data;

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return fail("Unknown product");

  const week = new Date(weekStart);
  await db.weeklyMetric.upsert({
    where: { productId_weekStart: { productId, weekStart: week } },
    update: { ...rest, d30: rest.d30 ?? null },
    create: { ...rest, productId, weekStart: week, d30: rest.d30 ?? null },
  });
  revalidateProduct(product.slug);
  return { ok: true };
}

/**
 * Paste rows straight out of a GA4 export. One week per line:
 * weekStart, installs, activation%, d1%, d7%, d30%, revenue, payingUsers
 */
export async function importMetricsCsv(productId: string, csv: string): Promise<ActionResult> {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return fail("Unknown product");

  const lines = csv
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^week/i.test(line));
  if (lines.length === 0) return fail("Nothing to import");

  let imported = 0;
  for (const line of lines) {
    const cells = line.split(/[,\t;]/).map((cell) => cell.trim());
    if (cells.length < 5) continue;
    const [week, installs, activation, d1, d7, d30, revenue, paying] = cells;
    const weekStart = new Date(week);
    if (Number.isNaN(weekStart.getTime())) continue;

    const data = {
      installs: Math.round(Number(installs) || 0),
      activationRate: Number(activation) || 0,
      d1: Number(d1) || 0,
      d7: Number(d7) || 0,
      d30: d30 ? Number(d30) : null,
      revenue: revenue ? Number(revenue) : 0,
      payingUsers: paying ? Math.round(Number(paying)) : 0,
      source: "GA4 import",
    };
    await db.weeklyMetric.upsert({
      where: { productId_weekStart: { productId, weekStart } },
      update: data,
      create: { ...data, productId, weekStart },
    });
    imported += 1;
  }

  if (imported === 0) return fail("No rows parsed — check the column order");
  revalidateProduct(product.slug);
  return { ok: true };
}

const thresholdSchema = z.object({
  productId: z.string().min(1),
  minWeeklyInstalls: z.coerce.number().int().min(0),
  minD1: z.coerce.number().min(0).max(100),
  minD7: z.coerce.number().min(0).max(100),
});

export async function saveThresholds(formData: FormData): Promise<ActionResult> {
  const parsed = thresholdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { productId, ...thresholds } = parsed.data;
  const product = await db.product.update({ where: { id: productId }, data: thresholds });
  revalidateProduct(product.slug);
  return { ok: true };
}

// -------------------------------------------------------------- experiments

const experimentSchema = z.object({
  productId: z.string().min(1, "Which product?"),
  title: z.string().min(1, "Give the experiment a name"),
  category: z.enum(EXPERIMENT_CATEGORIES),
  surface: z.enum(SURFACES),
  dimension: z.enum(DIMENSIONS),
  changeDescription: z.string().min(1, "What are you changing?"),
  audience: z.string().min(1, "Who sees it?"),
  expectedMetric: z.string().min(1, "Which metric should move?"),
  expectedDirection: z.enum(["UP", "DOWN"]),
  expectedSize: z.string().min(1, "By how much?"),
  timeframe: z.string().min(1, "Over what period?"),
  rationale: z.string().min(1, "Why do you believe this?"),
  primaryMetric: z.string().min(1, "Name the primary metric"),
  secondaryMetrics: z.string().optional(),
  guardrailMetric: z.string().optional(),
  minDetectableEffect: z.string().optional(),
  killCriteria: z.string().optional(),
  stopDate: z.string().optional(),
  minSampleSize: z.string().optional(),
  iceImpact: z.string().optional(),
  iceConfidence: z.string().optional(),
  iceEase: z.string().optional(),
  owner: z.string().min(1, "Who owns it?"),
  variantSummary: z.string().optional(),
  assetUrl: z.string().optional(),
  parentId: z.string().optional(),
  noteSlug: z.string().optional(),
});

function optionalInt(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function saveExperiment(
  experimentId: string | null,
  formData: FormData,
): Promise<ActionResult & { refId?: string }> {
  const parsed = experimentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const input = parsed.data;

  const data = {
    productId: input.productId,
    title: input.title,
    category: input.category,
    surface: input.surface,
    dimension: input.dimension,
    changeDescription: input.changeDescription,
    audience: input.audience,
    expectedMetric: input.expectedMetric,
    expectedDirection: input.expectedDirection,
    expectedSize: input.expectedSize,
    timeframe: input.timeframe,
    rationale: input.rationale,
    primaryMetric: input.primaryMetric,
    secondaryMetrics: input.secondaryMetrics || null,
    guardrailMetric: input.guardrailMetric || null,
    minDetectableEffect: input.minDetectableEffect || null,
    killCriteria: input.killCriteria || null,
    stopDate: input.stopDate ? new Date(input.stopDate) : null,
    minSampleSize: optionalInt(input.minSampleSize),
    iceImpact: optionalInt(input.iceImpact),
    iceConfidence: optionalInt(input.iceConfidence),
    iceEase: optionalInt(input.iceEase),
    owner: input.owner,
    variantSummary: input.variantSummary || null,
    assetUrl: input.assetUrl || null,
    parentId: input.parentId || null,
  };

  const scored = data.iceImpact != null && data.iceConfidence != null && data.iceEase != null;

  if (experimentId) {
    const updated = await db.experiment.update({ where: { id: experimentId }, data });
    revalidateProduct();
    revalidatePath(`/experiments/${updated.refId}`);
    return { ok: true, refId: updated.refId };
  }

  const last = await db.experiment.findFirst({ orderBy: { refId: "desc" }, select: { refId: true } });
  const n = last ? Number(last.refId.replace(/\D/g, "")) + 1 : 1;
  const refId = `EXP-${String(n).padStart(3, "0")}`;

  const created = await db.experiment.create({
    data: { ...data, refId, status: scored ? "SCORED" : "BACKLOG" },
  });
  revalidateProduct();
  return { ok: true, refId: created.refId };
}

export async function scoreExperiment(
  experimentId: string,
  scores: { impact: number; confidence: number; ease: number },
): Promise<ActionResult> {
  const experiment = await db.experiment.findUnique({ where: { id: experimentId } });
  if (!experiment) return fail("Unknown experiment");

  await db.experiment.update({
    where: { id: experimentId },
    data: {
      iceImpact: scores.impact,
      iceConfidence: scores.confidence,
      iceEase: scores.ease,
      status: experiment.status === "BACKLOG" ? "SCORED" : experiment.status,
    },
  });
  revalidateProduct();
  revalidatePath(`/experiments/${experiment.refId}`);
  return { ok: true };
}

export async function setExperimentStatus(
  experimentId: string,
  status: (typeof EXPERIMENT_STATUSES)[number],
): Promise<ActionResult> {
  const experiment = await db.experiment.findUnique({ where: { id: experimentId } });
  if (!experiment) return fail("Unknown experiment");

  // The launch gate. Nothing runs without a hypothesis, a primary metric, a
  // guardrail and a pre-registered stop rule.
  if (status === "RUNNING" && !canLaunch(experiment)) {
    return fail("Complete the launch checklist before starting this run");
  }

  await db.experiment.update({
    where: { id: experimentId },
    data: {
      status,
      startedAt: status === "RUNNING" ? (experiment.startedAt ?? new Date()) : experiment.startedAt,
      endedAt: ["ANALYSIS", "DECIDED"].includes(status)
        ? (experiment.endedAt ?? new Date())
        : experiment.endedAt,
    },
  });
  revalidateProduct();
  revalidatePath(`/experiments/${experiment.refId}`);
  return { ok: true };
}

const resultSchema = z.object({
  experimentId: z.string().min(1),
  baselineValue: z.coerce.number(),
  observedValue: z.coerce.number(),
  sampleSize: z.string().optional(),
  guardrailBreached: z.string().optional(),
  decision: z.enum(DECISIONS),
  learning: z.string().min(1, "Write down what you learned — that is the point"),
});

export async function recordResult(formData: FormData): Promise<ActionResult> {
  const parsed = resultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { experimentId, baselineValue, observedValue, sampleSize, guardrailBreached, decision, learning } =
    parsed.data;

  const experiment = await db.experiment.findUnique({ where: { id: experimentId } });
  if (!experiment) return fail("Unknown experiment");

  const deltaPercent =
    baselineValue === 0 ? 0 : Number((((observedValue - baselineValue) / baselineValue) * 100).toFixed(1));

  const data = {
    baselineValue,
    observedValue,
    deltaPercent,
    sampleSize: optionalInt(sampleSize),
    guardrailBreached: guardrailBreached === "on" || guardrailBreached === "true",
    decision,
    learning,
  };

  await db.experimentResult.upsert({
    where: { experimentId },
    update: data,
    create: { ...data, experimentId },
  });
  await db.experiment.update({
    where: { id: experimentId },
    data: { status: "DECIDED", endedAt: experiment.endedAt ?? new Date() },
  });

  revalidateProduct();
  revalidatePath(`/experiments/${experiment.refId}`);
  return { ok: true };
}

/** A finished experiment refills the backlog. That is how the queue stays stocked. */
export async function createChildExperiment(
  parentId: string,
  title: string,
): Promise<ActionResult & { refId?: string }> {
  const parent = await db.experiment.findUnique({ where: { id: parentId } });
  if (!parent) return fail("Unknown experiment");

  const last = await db.experiment.findFirst({ orderBy: { refId: "desc" }, select: { refId: true } });
  const n = last ? Number(last.refId.replace(/\D/g, "")) + 1 : 1;
  const refId = `EXP-${String(n).padStart(3, "0")}`;

  const created = await db.experiment.create({
    data: {
      refId,
      productId: parent.productId,
      title,
      category: parent.category,
      surface: parent.surface,
      dimension: parent.dimension,
      changeDescription: "",
      audience: parent.audience,
      expectedMetric: parent.expectedMetric,
      expectedDirection: parent.expectedDirection,
      expectedSize: "",
      timeframe: parent.timeframe,
      rationale: `Follows ${parent.refId}: ${parent.title}.`,
      primaryMetric: parent.primaryMetric,
      guardrailMetric: parent.guardrailMetric,
      status: "BACKLOG",
      owner: parent.owner,
      parentId: parent.id,
    },
  });

  revalidateProduct();
  revalidatePath(`/experiments/${parent.refId}`);
  return { ok: true, refId: created.refId };
}

export async function deleteExperiment(experimentId: string): Promise<ActionResult> {
  await db.experiment.delete({ where: { id: experimentId } });
  revalidateProduct();
  return { ok: true };
}
