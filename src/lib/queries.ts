import "server-only";

import { db } from "./db";
import {
  classify,
  gateProgress,
  liveHealth,
  type LiveHealth,
  type ProductStatus,
  type StatusInput,
} from "./status";
import { iceScore, isOverdue } from "./experiments";
import type { Gate, Phase } from "./taxonomy";

const productInclude = {
  stages: {
    include: {
      documents: { orderBy: { updatedAt: "desc" } },
      qaCycles: { orderBy: { cycleNumber: "asc" } },
    },
  },
  submissions: { orderBy: { submittedAt: "desc" } },
  metrics: { orderBy: { weekStart: "desc" } },
} as const;

export type ProductRecord = Awaited<
  ReturnType<typeof db.product.findFirstOrThrow<{ include: typeof productInclude }>>
>;

export type ProductWithStatus = ProductRecord & {
  derived: ProductStatus;
  health: LiveHealth | null;
  progress: number;
  phase: Phase;
  currentGate: Gate;
};

function toStatusInput(product: ProductRecord): StatusInput {
  return {
    phase: product.phase as Phase,
    currentGate: product.currentGate as Gate,
    minWeeklyInstalls: product.minWeeklyInstalls,
    minD1: product.minD1,
    minD7: product.minD7,
    stages: product.stages.map((stage) => ({
      gate: stage.gate as Gate,
      status: stage.status,
      startedAt: stage.startedAt,
      completedAt: stage.completedAt,
      expectedDays: stage.expectedDays,
      blockedReason: stage.blockedReason,
      updatedAt: stage.updatedAt,
      documents: stage.documents.map((doc) => ({
        docType: doc.docType,
        status: doc.status,
        updatedAt: doc.updatedAt,
      })),
      qaCycles: stage.qaCycles.map((cycle) => ({
        cycleNumber: cycle.cycleNumber,
        issueRate: cycle.issueRate,
        ranOn: cycle.ranOn,
      })),
    })),
    submissions: product.submissions.map((submission) => ({
      platform: submission.platform,
      status: submission.status,
      submittedAt: submission.submittedAt,
      rejectionReason: submission.rejectionReason,
      updatedAt: submission.updatedAt,
    })),
    metrics: product.metrics.map((metric) => ({
      weekStart: metric.weekStart,
      installs: metric.installs,
      d1: metric.d1,
      d7: metric.d7,
      activationRate: metric.activationRate,
      revenue: metric.revenue,
    })),
  };
}

export function withStatus(product: ProductRecord): ProductWithStatus {
  const input = toStatusInput(product);
  return {
    ...product,
    derived: classify(input),
    health: liveHealth(input),
    progress: gateProgress(product.stages.map((s) => ({ gate: s.gate as Gate, status: s.status }))),
    phase: product.phase as Phase,
    currentGate: product.currentGate as Gate,
  };
}

export async function getPortfolio(): Promise<ProductWithStatus[]> {
  const products = await db.product.findMany({
    where: { archived: false },
    include: productInclude,
    orderBy: { createdAt: "asc" },
  });
  return products.map(withStatus);
}

export async function getProduct(slug: string): Promise<ProductWithStatus | null> {
  const product = await db.product.findUnique({ where: { slug }, include: productInclude });
  return product ? withStatus(product) : null;
}

export async function getProductOptions() {
  return db.product.findMany({
    where: { archived: false },
    select: { id: true, slug: true, name: true, colorSeed: true },
    orderBy: { name: "asc" },
  });
}

const experimentInclude = {
  product: { select: { id: true, slug: true, name: true, colorSeed: true } },
  result: true,
  parent: { select: { refId: true, title: true } },
  children: { select: { refId: true, title: true, status: true } },
} as const;

export type ExperimentRecord = Awaited<
  ReturnType<typeof db.experiment.findFirstOrThrow<{ include: typeof experimentInclude }>>
>;

export type ExperimentWithScore = ExperimentRecord & {
  ice: number | null;
  overdue: boolean;
};

function decorate(experiment: ExperimentRecord): ExperimentWithScore {
  return { ...experiment, ice: iceScore(experiment), overdue: isOverdue(experiment) };
}

export async function getExperiments(): Promise<ExperimentWithScore[]> {
  const experiments = await db.experiment.findMany({
    include: experimentInclude,
    orderBy: { refId: "asc" },
  });
  return experiments.map(decorate);
}

export async function getExperiment(refId: string): Promise<ExperimentWithScore | null> {
  const experiment = await db.experiment.findUnique({
    where: { refId },
    include: experimentInclude,
  });
  return experiment ? decorate(experiment) : null;
}

export async function getProductExperiments(productId: string): Promise<ExperimentWithScore[]> {
  const experiments = await db.experiment.findMany({
    where: { productId },
    include: experimentInclude,
    orderBy: { refId: "asc" },
  });
  return experiments.map(decorate);
}

/** Recurring store rejection causes, so process fixes can be aimed at the common ones. */
export async function getRejectionRollup() {
  const rejections = await db.storeSubmission.findMany({
    where: { rejectionReason: { not: null } },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { submittedAt: "desc" },
  });

  const byReason = new Map<string, { reason: string; count: number; products: string[] }>();
  for (const rejection of rejections) {
    const key = rejection.rejectionReason!;
    const entry = byReason.get(key) ?? { reason: key, count: 0, products: [] };
    entry.count += 1;
    if (!entry.products.includes(rejection.product.name)) entry.products.push(rejection.product.name);
    byReason.set(key, entry);
  }

  return {
    rejections,
    byReason: [...byReason.values()].sort((a, b) => b.count - a.count),
  };
}

export async function getNextExperimentRef(): Promise<string> {
  const last = await db.experiment.findFirst({ orderBy: { refId: "desc" }, select: { refId: true } });
  const n = last ? Number(last.refId.replace(/\D/g, "")) + 1 : 1;
  return `EXP-${String(n).padStart(3, "0")}`;
}
