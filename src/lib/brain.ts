import "server-only";

import { db } from "./db";
import { listNotes } from "./vault";
import { hypothesisSentence } from "./experiments";
import { formatDate, formatPercent, formatNumber } from "./format";
import type { BrainCitation } from "./brain-types";
import {
  CATEGORY_LABEL,
  DIMENSION_LABEL,
  DOC_TYPE_LABEL,
  EXPERIMENT_STATUS_LABEL,
  GATE_SPEC,
  PHASE_LABEL,
  PLATFORM_LABEL,
  REJECTION_REASON_LABEL,
  STAGE_STATUS_LABEL,
  SURFACE_LABEL,
  type DocType,
  type ExperimentCategory,
  type ExperimentStatus,
  type Gate,
  type Phase,
  type StageStatus,
  type Surface,
} from "./taxonomy";

export type { BrainCitation } from "./brain-types";

export type BrainAnswer = {
  content: string;
  citations: BrainCitation[];
  engine: "local" | "openai" | "anthropic";
};

export type ContextChunk = {
  id: string;
  kind: BrainCitation["kind"];
  title: string;
  text: string;
  href?: string;
  detail?: string;
  updatedAt?: Date | null;
  extra?: Record<string, string>;
};

const STOP = new Set([
  "the",
  "a",
  "an",
  "of",
  "on",
  "in",
  "is",
  "it",
  "its",
  "was",
  "were",
  "be",
  "to",
  "for",
  "and",
  "or",
  "what",
  "where",
  "when",
  "who",
  "how",
  "why",
  "which",
  "me",
  "my",
  "our",
  "this",
  "that",
  "with",
  "from",
  "about",
  "can",
  "you",
  "please",
  "tell",
  "give",
  "show",
  "find",
  "latest",
]);

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^\.+|\.+$/g, ""))
    .filter((token) => token.length > 1 && !STOP.has(token));
}

function includesPhrase(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase().trim());
}

/** Pack everything the brain is allowed to see for one product. */
export async function buildProductChunks(productId: string): Promise<ContextChunk[]> {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      stages: {
        include: {
          documents: { orderBy: { updatedAt: "desc" } },
          qaCycles: { orderBy: { cycleNumber: "asc" } },
        },
      },
      submissions: { orderBy: { submittedAt: "desc" } },
      metrics: { orderBy: { weekStart: "desc" } },
      experiments: {
        include: { result: true },
        orderBy: { refId: "asc" },
      },
    },
  });
  if (!product) return [];

  const notes = (await listNotes()).filter((note) => note.products.includes(product.slug));
  const chunks: ContextChunk[] = [];

  chunks.push({
    id: `product:${product.id}`,
    kind: "product",
    title: product.name,
    text: [
      `${product.name}: ${product.tagline}.`,
      `Audience: ${product.audience}.`,
      `Stores: ${product.platforms}.`,
      `Currently in ${PHASE_LABEL[product.phase as Phase]}, gate ${GATE_SPEC[product.currentGate as Gate].label}.`,
      `Keep/kill thresholds: ${product.minWeeklyInstalls} weekly installs, D1 ${product.minD1}%, D7 ${product.minD7}%.`,
    ].join(" "),
    href: `/products/${product.slug}`,
    updatedAt: product.updatedAt,
  });

  if (product.brief?.trim()) {
    chunks.push({
      id: `brief:${product.id}`,
      kind: "brief",
      title: `${product.name} living brief`,
      text: product.brief.trim(),
      href: `/products/${product.slug}?tab=brain`,
      detail: "Living brief",
      updatedAt: product.updatedAt,
    });
  }

  for (const stage of product.stages) {
    const spec = GATE_SPEC[stage.gate as Gate];
    const stageText = [
      `${spec.label} is ${STAGE_STATUS_LABEL[stage.status as StageStatus] ?? stage.status}.`,
      spec.intent,
      stage.owner ? `Owner: ${stage.owner}.` : "",
      stage.blockedReason ? `Blocked: ${stage.blockedReason}.` : "",
      stage.notes ? `Notes: ${stage.notes}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    chunks.push({
      id: `stage:${stage.id}`,
      kind: "stage",
      title: spec.label,
      text: stageText,
      href: `/products/${product.slug}`,
      detail: STAGE_STATUS_LABEL[stage.status as StageStatus] ?? stage.status,
      updatedAt: stage.updatedAt,
      extra: { gate: stage.gate, status: stage.status },
    });

    for (const doc of stage.documents) {
      const typeLabel = DOC_TYPE_LABEL[doc.docType as DocType] ?? doc.docType;
      chunks.push({
        id: `doc:${doc.id}`,
        kind: "document",
        title: doc.title,
        text: [
          `${typeLabel}: ${doc.title} (${doc.version}, ${doc.status.toLowerCase().replace("_", " ")}).`,
          `Owned by ${doc.owner}.`,
          `Last updated ${formatDate(doc.updatedAt)}.`,
          doc.summary ? `Summary: ${doc.summary}` : "No summary written — the file itself is not stored here.",
          `Open at ${doc.url}`,
        ].join(" "),
        href: doc.url,
        detail: `${typeLabel} · ${doc.version}`,
        updatedAt: doc.updatedAt,
        extra: {
          docType: doc.docType,
          version: doc.version.toLowerCase(),
          status: doc.status,
          title: doc.title.toLowerCase(),
        },
      });
    }

    for (const cycle of stage.qaCycles) {
      chunks.push({
        id: `qa:${cycle.id}`,
        kind: "qa",
        title: `QA cycle ${cycle.cycleNumber}`,
        text: [
          `QA cycle ${cycle.cycleNumber} on ${formatDate(cycle.ranOn)}: issue rate ${formatPercent(cycle.issueRate)},`,
          `${cycle.issuesFound} found, ${cycle.issuesFixed} fixed.`,
          `Split: ${cycle.devIssues} dev, ${cycle.designIssues} design, ${cycle.prdIssues} PRD.`,
          cycle.buildLabel ? `Build ${cycle.buildLabel}.` : "",
        ]
          .filter(Boolean)
          .join(" "),
        href: cycle.sheetUrl || `/products/${product.slug}`,
        detail: `${formatPercent(cycle.issueRate)} issue rate`,
        updatedAt: cycle.ranOn,
        extra: { cycle: String(cycle.cycleNumber) },
      });
    }
  }

  for (const submission of product.submissions) {
    const platform = PLATFORM_LABEL[submission.platform as keyof typeof PLATFORM_LABEL] ?? submission.platform;
    chunks.push({
      id: `sub:${submission.id}`,
      kind: "submission",
      title: `${platform} ${submission.versionLabel}`,
      text: [
        `${platform} submission ${submission.versionLabel} is ${submission.status.toLowerCase().replace("_", " ")}.`,
        `Submitted ${formatDate(submission.submittedAt)}.`,
        submission.rejectionReason
          ? `Rejection: ${REJECTION_REASON_LABEL[submission.rejectionReason as keyof typeof REJECTION_REASON_LABEL] ?? submission.rejectionReason}. ${submission.rejectionNotes ?? ""}`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      href: `/products/${product.slug}`,
      detail: submission.status,
      updatedAt: submission.updatedAt,
    });
  }

  for (const metric of product.metrics) {
    chunks.push({
      id: `metric:${metric.id}`,
      kind: "metric",
      title: `Week of ${formatDate(metric.weekStart)}`,
      text: [
        `Week starting ${formatDate(metric.weekStart)}: ${formatNumber(metric.installs)} installs,`,
        `activation ${formatPercent(metric.activationRate)}, D1 ${formatPercent(metric.d1)}, D7 ${formatPercent(metric.d7)}`,
        metric.d30 != null ? `, D30 ${formatPercent(metric.d30)}` : "",
        `, revenue ${metric.revenue}, ${metric.payingUsers} paying users.`,
        `Source: ${metric.source}.`,
      ].join(" "),
      href: `/products/${product.slug}`,
      detail: `${formatNumber(metric.installs)} installs`,
      updatedAt: metric.weekStart,
    });
  }

  for (const experiment of product.experiments) {
    const sentence = hypothesisSentence(experiment);
    const result = experiment.result
      ? `Decision: ${experiment.result.decision}. ${experiment.result.learning} Baseline ${experiment.result.baselineValue} → ${experiment.result.observedValue} (${experiment.result.deltaPercent}%).`
      : "No result recorded yet.";
    chunks.push({
      id: `exp:${experiment.id}`,
      kind: "experiment",
      title: `${experiment.refId}: ${experiment.title}`,
      text: [
        `${experiment.refId} (${EXPERIMENT_STATUS_LABEL[experiment.status as ExperimentStatus] ?? experiment.status},`,
        `${CATEGORY_LABEL[experiment.category as ExperimentCategory] ?? experiment.category},`,
        `${SURFACE_LABEL[experiment.surface as Surface] ?? experiment.surface},`,
        `${DIMENSION_LABEL[experiment.dimension as keyof typeof DIMENSION_LABEL] ?? experiment.dimension}).`,
        sentence,
        experiment.variantSummary ? `Variants: ${experiment.variantSummary}` : "",
        experiment.killCriteria ? `Kill criteria: ${experiment.killCriteria}` : "",
        result,
      ]
        .filter(Boolean)
        .join(" "),
      href: `/experiments/${experiment.refId}`,
      detail: EXPERIMENT_STATUS_LABEL[experiment.status as ExperimentStatus] ?? experiment.status,
      updatedAt: experiment.updatedAt,
      extra: {
        status: experiment.status,
        surface: experiment.surface.toLowerCase(),
        refId: experiment.refId.toLowerCase(),
      },
    });
  }

  for (const note of notes) {
    chunks.push({
      id: `note:${note.slug}`,
      kind: "note",
      title: note.title,
      text: `${note.title}. Tags: ${note.tags.join(", ") || "none"}. ${note.body}`,
      href: `/vault/${note.slug}`,
      detail: note.updated,
      updatedAt: note.updated ? new Date(note.updated) : null,
      extra: { tags: note.tags.join(" ").toLowerCase() },
    });
  }

  return chunks;
}

type Scored = ContextChunk & { score: number };

export function retrieveChunks(query: string, chunks: ContextChunk[], limit = 8): Scored[] {
  const queryTokens = tokens(query);
  const version = query.toLowerCase().match(/\bv\d+\b/)?.[0];
  const wantsRecent = /\b(recent|latest|current|newest|last)\b/i.test(query);
  const wantsPrd = /\bprd|requirements\b/i.test(query);
  const wantsOnboarding = /\bonboard/i.test(query);
  const wantsWhere = /\bwhere|link|url|find|open\b/i.test(query);

  const scored = chunks.map((chunk) => {
    const hay = `${chunk.title} ${chunk.text} ${chunk.detail ?? ""} ${Object.values(chunk.extra ?? {}).join(" ")}`.toLowerCase();
    const hayTokens = new Set(tokens(hay));
    let score = 0;

    for (const token of queryTokens) {
      if (hayTokens.has(token)) score += 2;
      if (chunk.title.toLowerCase().includes(token)) score += 3;
    }

    if (queryTokens.length >= 2 && includesPhrase(hay, query)) score += 10;

    if (version && (chunk.extra?.version === version || hay.includes(version))) score += 12;
    if (wantsPrd && chunk.extra?.docType === "PRD") score += 14;
    if (wantsPrd && chunk.kind === "document" && includesPhrase(chunk.title, "prd")) score += 6;
    if (wantsOnboarding && (hay.includes("onboard") || chunk.extra?.surface === "onboarding")) score += 10;
    if (wantsWhere && chunk.kind === "document") score += 4;
    if (wantsRecent && chunk.kind === "document") {
      const ageDays = chunk.updatedAt ? (Date.now() - chunk.updatedAt.getTime()) / 86_400_000 : 400;
      score += Math.max(0, 8 - ageDays / 30);
    }

    return { ...chunk, score };
  });

  return scored
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => {
      if (wantsRecent && Math.abs(b.score - a.score) < 2) {
        return (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);
      }
      return b.score - a.score;
    })
    .slice(0, limit);
}

function citationsFrom(chunks: ContextChunk[]): BrainCitation[] {
  const seen = new Set<string>();
  const citations: BrainCitation[] = [];
  for (const chunk of chunks) {
    if (chunk.kind === "product") continue;
    if (seen.has(chunk.id)) continue;
    seen.add(chunk.id);
    citations.push({
      kind: chunk.kind,
      title: chunk.title,
      href: chunk.href,
      detail: chunk.detail,
    });
  }
  return citations.slice(0, 6);
}

function snippet(text: string, max = 420): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

function answerLocal(query: string, retrieved: Scored[]): BrainAnswer {
  if (retrieved.length === 0) {
    return {
      content:
        "Nothing in this product's workspace matches that yet. The brain only reads what you have added here: document links and their summaries, the living brief, vault notes tagged to this product, experiments, QA cycles and weekly numbers. Link the file or paste the change into the brief, then ask again.",
      citations: [],
      engine: "local",
    };
  }

  const wantsWhere = /\bwhere|link|url|find|open\b/i.test(query);
  const wantsPrd = /\bprd|requirements\b/i.test(query);
  const docs = retrieved.filter((chunk) => chunk.kind === "document");

  if (wantsWhere || (wantsPrd && docs.length > 0 && retrieved[0].kind === "document")) {
    const focus = (wantsPrd ? docs.filter((d) => d.extra?.docType === "PRD") : docs).slice(0, 3);
    const list = (focus.length > 0 ? focus : docs.slice(0, 3)).map((doc) => {
      const when = doc.updatedAt ? ` · updated ${formatDate(doc.updatedAt)}` : "";
      const link = doc.href ? ` [Open](${doc.href})` : "";
      const summary = doc.text.includes("Summary:")
        ? doc.text.slice(doc.text.indexOf("Summary:") + 9).replace(/ Open at .*$/, "")
        : "";
      return `- **${doc.title}** (${doc.detail ?? "document"}${when})${link}${summary ? `\n  ${summary}` : ""}`;
    });

    return {
      content:
        list.length > 0
          ? `Here is what this product has on file:\n\n${list.join("\n")}\n\nThe file itself stays at that link. The brain reads the title, version, owner and summary you stored with it.`
          : snippet(retrieved[0].text),
      citations: citationsFrom(focus.length > 0 ? focus : retrieved),
      engine: "local",
    };
  }

  const lines: string[] = [];
  for (const chunk of retrieved.slice(0, 4)) {
    if (chunk.kind === "document") {
      const summary = chunk.text.includes("Summary:")
        ? chunk.text.slice(chunk.text.indexOf("Summary:") + 9).replace(/ Open at .*$/, "")
        : snippet(chunk.text, 280);
      lines.push(`**${chunk.title}** (${chunk.detail ?? "document"}): ${summary}`);
    } else if (chunk.kind === "note") {
      lines.push(`From the note *${chunk.title}*: ${snippet(chunk.text.replace(/^.*?Tags:.*?\.\s*/, ""), 320)}`);
    } else if (chunk.kind === "experiment") {
      lines.push(`**${chunk.title}** (${chunk.detail}): ${snippet(chunk.text, 320)}`);
    } else if (chunk.kind === "brief") {
      lines.push(`From the living brief: ${snippet(chunk.text, 360)}`);
    } else {
      lines.push(`${snippet(chunk.text, 280)}`);
    }
  }

  return {
    content: lines.join("\n\n"),
    citations: citationsFrom(retrieved),
    engine: "local",
  };
}

function llmKey(): { engine: "openai" | "anthropic"; key: string } | null {
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) return { engine: "openai", key: openai };
  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) return { engine: "anthropic", key: anthropic };
  return null;
}

async function answerWithLlm(
  query: string,
  productName: string,
  retrieved: Scored[],
  history: { role: string; content: string }[],
  engine: "openai" | "anthropic",
  key: string,
): Promise<string | null> {
  const context = retrieved
    .map(
      (chunk, index) =>
        `[${index + 1}] (${chunk.kind}) ${chunk.title}${chunk.href ? ` — ${chunk.href}` : ""}\n${chunk.text}`,
    )
    .join("\n\n");

  const system = `You are the product brain for ${productName}, a workspace that indexes documents, vault notes, experiments, QA and weekly metrics for a single app. Answer only from the context. If the context does not contain the answer, say so and name the document type or note that would fill the gap. Prefer the newest matching version when asked for "recent" or a version like v3. Quote specifics (versions, dates, owners, URLs). Keep the answer tight: a short paragraph, then bullets if there are several facts. Markdown is fine. Do not invent files that are not in the context.`;

  const messages = [
    ...history.slice(-6).map((message) => ({
      role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: message.content,
    })),
    {
      role: "user" as const,
      content: `Context:\n${context}\n\nQuestion: ${query}`,
    },
  ];

  try {
    if (engine === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
          temperature: 0.2,
          messages: [{ role: "system", content: system }, ...messages],
        }),
      });
      if (!response.ok) return null;
      const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return json.choices?.[0]?.message?.content?.trim() || null;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514",
        max_tokens: 800,
        system,
        messages,
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };
    return json.content?.find((part) => part.type === "text")?.text?.trim() || null;
  } catch {
    return null;
  }
}

export async function answerQuestion(
  productId: string,
  query: string,
  history: { role: string; content: string }[] = [],
): Promise<BrainAnswer> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });
  const chunks = await buildProductChunks(productId);
  const retrieved = retrieveChunks(query, chunks);
  const local = answerLocal(query, retrieved);
  const llm = llmKey();
  if (!llm || retrieved.length === 0) return local;

  const generated = await answerWithLlm(query, product?.name ?? "this product", retrieved, history, llm.engine, llm.key);
  if (!generated) return local;
  return { content: generated, citations: local.citations, engine: llm.engine };
}

export function parseCitations(raw: string): BrainCitation[] {
  try {
    const value = JSON.parse(raw) as BrainCitation[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
