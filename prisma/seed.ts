/**
 * Seeds a portfolio that mirrors the real shape of the operation: two apps live
 * and measured, two sitting with store reviewers, two in production at different
 * sub-stages. Names are placeholders — rename them in the products table or here.
 *
 * Dates are all relative to the seed run, so the ageing and stall rules have
 * something real to bite on.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { GATES, GATE_SPEC, type DocType, type Gate } from "../src/lib/taxonomy";

const CLEARED_MARKER = path.join(process.cwd(), "prisma", ".workspace-cleared");

const databaseUrl =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "workspace.db")}`;

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });

const NOW = new Date();
const day = 86_400_000;

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * day);
}

function daysAhead(n: number): Date {
  return new Date(NOW.getTime() + n * day);
}

/** Monday of the week that started n weeks ago. */
function weekStart(weeksAgo: number): Date {
  const d = new Date(NOW.getTime() - weeksAgo * 7 * day);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

type DocSeed = {
  title: string;
  docType: DocType;
  owner: string;
  status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "SUPERSEDED";
  version?: string;
  summary?: string;
  updatedDaysAgo: number;
};

type StageSeed = {
  gate: Gate;
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETE";
  startedDaysAgo?: number;
  completedDaysAgo?: number;
  owner?: string;
  blockedReason?: string;
  notes?: string;
  documents?: DocSeed[];
  qaCycles?: {
    cycleNumber: number;
    ranDaysAgo: number;
    issuesFound: number;
    issuesFixed: number;
    issueRate: number;
    devIssues: number;
    designIssues: number;
    prdIssues: number;
    buildLabel: string;
  }[];
};

type ProductSeed = {
  slug: string;
  name: string;
  tagline: string;
  audience: string;
  platforms: string;
  phase: "PRE_PRODUCTION" | "PRODUCTION" | "REVIEW" | "POST_PRODUCTION";
  currentGate: Gate;
  colorSeed: string;
  minWeeklyInstalls?: number;
  minD1?: number;
  minD7?: number;
  brief?: string;
  stages: StageSeed[];
  submissions?: {
    platform: "APP_STORE" | "PLAY_STORE";
    versionLabel: string;
    submittedDaysAgo: number;
    status: "IN_REVIEW" | "APPROVED" | "REJECTED" | "RESUBMITTED" | "LIVE";
    decidedDaysAgo?: number;
    rejectionReason?: string;
    rejectionNotes?: string;
    resubmittedDaysAgo?: number;
  }[];
  metrics?: {
    installs: number;
    activationRate: number;
    d1: number;
    d7: number;
    d30?: number;
    revenue: number;
    payingUsers: number;
  }[];
};

const figma = (file: string) => `https://www.figma.com/file/${file}`;
const drive = (id: string) => `https://docs.google.com/document/d/${id}`;
const sheet = (id: string) => `https://docs.google.com/spreadsheets/d/${id}`;

// A completed gate, written once so the six products stay readable below.
function completedGate(
  gate: Gate,
  completedDaysAgo: number,
  owner: string,
  documents: DocSeed[],
): StageSeed {
  return {
    gate,
    status: "COMPLETE",
    startedDaysAgo: completedDaysAgo + GATE_SPEC[gate].expectedDays,
    completedDaysAgo,
    owner,
    documents,
  };
}

const researchDocs = (slug: string, owner: string, ageDays: number): DocSeed[] => [
  {
    title: "Market gap validation",
    docType: "MARKET_GAP",
    owner,
    status: "APPROVED",
    summary: "Where the incumbents underserve power users, with sizing.",
    updatedDaysAgo: ageDays,
  },
  {
    title: "Competitive landscape — cumulative players",
    docType: "COMPETITOR_CUMULATIVE",
    owner,
    status: "APPROVED",
    summary: "Every player in the category, refreshed monthly as a sense-check.",
    updatedDaysAgo: Math.max(2, ageDays - 20),
  },
  {
    title: "Competitor UI/UX teardown",
    docType: "COMPETITOR_UIUX",
    owner,
    status: "APPROVED",
    summary: "Patterns that are working for them, screen by screen.",
    updatedDaysAgo: ageDays,
  },
  {
    title: "Pricing and positioning scan",
    docType: "COMPETITOR_PRICING",
    owner,
    status: "APPROVED",
    summary: "Tiers, trial lengths and the wording each one leads with.",
    updatedDaysAgo: Math.max(3, ageDays - 14),
  },
];

const prdDocs = (owner: string, ageDays: number, status: DocSeed["status"] = "APPROVED"): DocSeed[] => [
  {
    title: "Product requirements",
    docType: "PRD",
    owner,
    status,
    version: "v2",
    summary: "Idea, value, feature set and implementation notes for design and dev.",
    updatedDaysAgo: ageDays,
  },
  {
    title: "Privacy policy",
    docType: "PRIVACY_POLICY",
    owner: "Legal",
    status,
    updatedDaysAgo: ageDays + 2,
  },
  {
    title: "Terms of service",
    docType: "TOS",
    owner: "Legal",
    status,
    updatedDaysAgo: ageDays + 2,
  },
];

const designDocs = (owner: string, ageDays: number, status: DocSeed["status"] = "APPROVED"): DocSeed[] => [
  {
    title: "App UI/UX — all flows",
    docType: "FIGMA_APP_UI",
    owner,
    status,
    version: "v3",
    summary: "End-to-end screens including empty and error states.",
    updatedDaysAgo: ageDays,
  },
  {
    title: "Store graphics — App Store and Play Store",
    docType: "FIGMA_STORE_GRAPHICS",
    owner,
    status,
    updatedDaysAgo: ageDays,
  },
  { title: "App icon set", docType: "FIGMA_APP_ICON", owner, status, updatedDaysAgo: ageDays },
];

const analyticsDoc = (owner: string, ageDays: number, status: DocSeed["status"] = "APPROVED"): DocSeed[] => [
  {
    title: "Analytics catalogue — GA4 and PostHog",
    docType: "ANALYTICS_CATALOGUE",
    owner,
    status,
    version: "v2",
    summary: "User properties, events, parameters and accepted values per event.",
    updatedDaysAgo: ageDays,
  },
];

const products: ProductSeed[] = [
  // ---------------------------------------------------------------- live apps
  {
    slug: "ledgerlane",
    name: "LedgerLane",
    tagline: "Receipt capture and expense categorisation for freelancers",
    audience: "Self-employed professionals filing their own returns",
    platforms: "ios,android",
    phase: "POST_PRODUCTION",
    currentGate: "LIVE",
    colorSeed: "emerald",
    brief: [
      "LedgerLane is receipt-first bookkeeping for sole traders.",
      "Onboarding v3 (shipped in 1.4.0): three screens instead of seven, camera permission delayed until the first receipt capture, account creation deferred until the user tries to export.",
      "v2 added recurring expenses and CSV export. v1 was capture plus categories only.",
      "The binding activation leak is still the signup wall — 23% of installs leave before a single scan, which is why EXP-004 is queued.",
    ].join(" "),
    stages: [
      completedGate("MARKET_RESEARCH", 168, "Rao", researchDocs("ledgerlane", "Rao", 24)),
      completedGate("PRD", 18, "Rao", [
        {
          title: "Product requirements",
          docType: "PRD",
          owner: "Rao",
          status: "APPROVED",
          version: "v3",
          summary:
            "v3 (current): onboarding cut from seven screens to three. Camera permission moves to the first receipt capture, not the splash. Account creation is deferred until export. Sign-in with Apple/Google stays optional on screen one. Activation event remains first_receipt_scan. v2 added recurring expenses and CSV export. v1 was capture plus categories.",
          updatedDaysAgo: 18,
        },
        {
          title: "Privacy policy",
          docType: "PRIVACY_POLICY",
          owner: "Legal",
          status: "APPROVED",
          updatedDaysAgo: 20,
        },
        {
          title: "Terms of service",
          docType: "TOS",
          owner: "Legal",
          status: "APPROVED",
          updatedDaysAgo: 20,
        },
      ]),
      completedGate("DESIGN", 16, "Imran", [
        {
          title: "App UI/UX — all flows",
          docType: "FIGMA_APP_UI",
          owner: "Imran",
          status: "APPROVED",
          version: "v3",
          summary:
            "v3 onboarding frames: 1) value + optional sign-in, 2) first capture with camera permission in-context, 3) category confirmation. The old seven-step wizard (permissions, account, tax year, currency, bank, sample data, home) is in the archive page. Empty and error states for a failed scan are new in this version.",
          updatedDaysAgo: 16,
        },
        {
          title: "Store graphics — App Store and Play Store",
          docType: "FIGMA_STORE_GRAPHICS",
          owner: "Imran",
          status: "APPROVED",
          updatedDaysAgo: 16,
        },
        { title: "App icon set", docType: "FIGMA_APP_ICON", owner: "Imran", status: "APPROVED", updatedDaysAgo: 16 },
      ]),
      completedGate("ANALYTICS_CATALOGUE", 130, "Rao", analyticsDoc("Rao", 130)),
      {
        gate: "BUILD",
        status: "COMPLETE",
        startedDaysAgo: 136,
        completedDaysAgo: 118,
        owner: "Hassan",
        documents: [
          {
            title: "Release build 1.4.0",
            docType: "APK_BUILD",
            owner: "Hassan",
            status: "APPROVED",
            version: "1.4.0",
            updatedDaysAgo: 9,
          },
        ],
      },
      {
        gate: "QA",
        status: "COMPLETE",
        startedDaysAgo: 118,
        completedDaysAgo: 104,
        owner: "Sana",
        documents: [
          {
            title: "QA sheet — cycles 1 to 6",
            docType: "QA_SHEET",
            owner: "Sana",
            status: "APPROVED",
            updatedDaysAgo: 104,
          },
        ],
        qaCycles: [
          { cycleNumber: 1, ranDaysAgo: 116, issuesFound: 47, issuesFixed: 47, issueRate: 38.2, devIssues: 29, designIssues: 14, prdIssues: 4, buildLabel: "1.0.0-rc1" },
          { cycleNumber: 2, ranDaysAgo: 113, issuesFound: 31, issuesFixed: 31, issueRate: 26.5, devIssues: 21, designIssues: 9, prdIssues: 1, buildLabel: "1.0.0-rc2" },
          { cycleNumber: 3, ranDaysAgo: 110, issuesFound: 19, issuesFixed: 19, issueRate: 16.1, devIssues: 13, designIssues: 6, prdIssues: 0, buildLabel: "1.0.0-rc3" },
          { cycleNumber: 4, ranDaysAgo: 108, issuesFound: 12, issuesFixed: 12, issueRate: 10.4, devIssues: 9, designIssues: 3, prdIssues: 0, buildLabel: "1.0.0-rc4" },
          { cycleNumber: 5, ranDaysAgo: 106, issuesFound: 7, issuesFixed: 7, issueRate: 5.9, devIssues: 6, designIssues: 1, prdIssues: 0, buildLabel: "1.0.0-rc5" },
          { cycleNumber: 6, ranDaysAgo: 104, issuesFound: 3, issuesFixed: 3, issueRate: 2.5, devIssues: 3, designIssues: 0, prdIssues: 0, buildLabel: "1.0.0" },
        ],
      },
      {
        gate: "STORE_SUBMISSION",
        status: "COMPLETE",
        startedDaysAgo: 104,
        completedDaysAgo: 96,
        owner: "Rao",
        documents: [
          {
            title: "Store listing copy and assets",
            docType: "STORE_LISTING",
            owner: "Rao",
            status: "APPROVED",
            updatedDaysAgo: 96,
          },
        ],
      },
      {
        gate: "LIVE",
        status: "IN_PROGRESS",
        startedDaysAgo: 96,
        owner: "Rao",
        notes: "Weekly review every Monday against acquisition and retention thresholds.",
      },
    ],
    submissions: [
      { platform: "APP_STORE", versionLabel: "1.0.0", submittedDaysAgo: 104, status: "LIVE", decidedDaysAgo: 98 },
      { platform: "PLAY_STORE", versionLabel: "1.0.0", submittedDaysAgo: 104, status: "LIVE", decidedDaysAgo: 101 },
    ],
    // Still clearing every threshold, but every line has been falling for a
    // quarter. The kind of decline that is easy to miss week to week.
    metrics: [
      { installs: 1980, activationRate: 63.8, d1: 61.4, d7: 21.4, d30: 11.2, revenue: 2310, payingUsers: 104 },
      { installs: 1920, activationRate: 63.1, d1: 60.8, d7: 20.9, d30: 10.9, revenue: 2240, payingUsers: 101 },
      { installs: 1865, activationRate: 62.6, d1: 60.1, d7: 20.3, d30: 10.6, revenue: 2170, payingUsers: 98 },
      { installs: 1810, activationRate: 62.0, d1: 59.6, d7: 19.8, d30: 10.2, revenue: 2095, payingUsers: 94 },
      { installs: 1740, activationRate: 61.4, d1: 59.0, d7: 19.2, d30: 9.9, revenue: 2010, payingUsers: 91 },
      { installs: 1675, activationRate: 60.8, d1: 58.5, d7: 18.7, d30: 9.5, revenue: 1930, payingUsers: 87 },
      { installs: 1610, activationRate: 60.1, d1: 58.0, d7: 18.1, d30: 9.2, revenue: 1855, payingUsers: 84 },
      { installs: 1535, activationRate: 59.5, d1: 57.4, d7: 17.6, d30: 8.8, revenue: 1770, payingUsers: 80 },
      { installs: 1460, activationRate: 59.0, d1: 56.9, d7: 17.0, d30: 8.5, revenue: 1685, payingUsers: 76 },
      { installs: 1385, activationRate: 58.4, d1: 56.5, d7: 16.4, d30: 8.1, revenue: 1600, payingUsers: 72 },
      { installs: 1300, activationRate: 57.9, d1: 56.1, d7: 15.9, d30: 7.8, revenue: 1510, payingUsers: 68 },
      { installs: 1210, activationRate: 57.2, d1: 55.8, d7: 15.4, d30: 7.4, revenue: 1415, payingUsers: 64 },
    ],
  },
  {
    slug: "shutterproof",
    name: "Shutterproof",
    tagline: "Batch RAW culling and metadata tagging on mobile",
    audience: "Semi-professional photographers shooting high volume",
    platforms: "ios,android",
    phase: "POST_PRODUCTION",
    currentGate: "LIVE",
    colorSeed: "sky",
    stages: [
      completedGate("MARKET_RESEARCH", 210, "Rao", researchDocs("shutterproof", "Rao", 31)),
      completedGate("PRD", 194, "Rao", prdDocs("Rao", 194)),
      completedGate("DESIGN", 180, "Imran", designDocs("Imran", 180)),
      completedGate("ANALYTICS_CATALOGUE", 174, "Rao", analyticsDoc("Rao", 174)),
      {
        gate: "BUILD",
        status: "COMPLETE",
        startedDaysAgo: 180,
        completedDaysAgo: 160,
        owner: "Hassan",
        documents: [
          {
            title: "Release build 2.1.3",
            docType: "APK_BUILD",
            owner: "Hassan",
            status: "APPROVED",
            version: "2.1.3",
            updatedDaysAgo: 16,
          },
        ],
      },
      {
        gate: "QA",
        status: "COMPLETE",
        startedDaysAgo: 160,
        completedDaysAgo: 146,
        owner: "Sana",
        documents: [
          { title: "QA sheet — cycles 1 to 5", docType: "QA_SHEET", owner: "Sana", status: "APPROVED", updatedDaysAgo: 146 },
        ],
        qaCycles: [
          { cycleNumber: 1, ranDaysAgo: 158, issuesFound: 52, issuesFixed: 52, issueRate: 41.6, devIssues: 33, designIssues: 15, prdIssues: 4, buildLabel: "2.0.0-rc1" },
          { cycleNumber: 2, ranDaysAgo: 155, issuesFound: 28, issuesFixed: 28, issueRate: 23.1, devIssues: 20, designIssues: 8, prdIssues: 0, buildLabel: "2.0.0-rc2" },
          { cycleNumber: 3, ranDaysAgo: 152, issuesFound: 16, issuesFixed: 16, issueRate: 13.4, devIssues: 12, designIssues: 4, prdIssues: 0, buildLabel: "2.0.0-rc3" },
          { cycleNumber: 4, ranDaysAgo: 149, issuesFound: 9, issuesFixed: 9, issueRate: 7.6, devIssues: 7, designIssues: 2, prdIssues: 0, buildLabel: "2.0.0-rc4" },
          { cycleNumber: 5, ranDaysAgo: 146, issuesFound: 4, issuesFixed: 4, issueRate: 3.3, devIssues: 4, designIssues: 0, prdIssues: 0, buildLabel: "2.0.0" },
        ],
      },
      {
        gate: "STORE_SUBMISSION",
        status: "COMPLETE",
        startedDaysAgo: 146,
        completedDaysAgo: 138,
        owner: "Rao",
        documents: [
          { title: "Store listing copy and assets", docType: "STORE_LISTING", owner: "Rao", status: "APPROVED", updatedDaysAgo: 138 },
        ],
      },
      {
        gate: "LIVE",
        status: "IN_PROGRESS",
        startedDaysAgo: 138,
        owner: "Rao",
        notes: "Acquisition has never cleared the weekly threshold. Retention is the only thing holding it up.",
      },
    ],
    submissions: [
      { platform: "APP_STORE", versionLabel: "2.0.0", submittedDaysAgo: 146, status: "LIVE", decidedDaysAgo: 141 },
      { platform: "PLAY_STORE", versionLabel: "2.0.0", submittedDaysAgo: 146, status: "LIVE", decidedDaysAgo: 143 },
    ],
    // Retention has been above the line for a quarter. Acquisition never has —
    // and the gap is now eight installs a week.
    metrics: [
      { installs: 640, activationRate: 48.2, d1: 51.1, d7: 16.8, d30: 8.4, revenue: 980, payingUsers: 41 },
      { installs: 690, activationRate: 48.9, d1: 51.8, d7: 17.1, d30: 8.6, revenue: 1020, payingUsers: 43 },
      { installs: 725, activationRate: 49.4, d1: 52.4, d7: 17.4, d30: 8.8, revenue: 1080, payingUsers: 45 },
      { installs: 780, activationRate: 50.1, d1: 52.9, d7: 17.9, d30: 9.1, revenue: 1140, payingUsers: 48 },
      { installs: 810, activationRate: 50.8, d1: 53.4, d7: 18.2, d30: 9.4, revenue: 1190, payingUsers: 50 },
      { installs: 845, activationRate: 51.2, d1: 53.8, d7: 18.6, d30: 9.6, revenue: 1240, payingUsers: 52 },
      { installs: 880, activationRate: 51.9, d1: 54.1, d7: 18.9, d30: 9.9, revenue: 1290, payingUsers: 54 },
      { installs: 910, activationRate: 52.4, d1: 54.6, d7: 19.2, d30: 10.1, revenue: 1345, payingUsers: 56 },
      { installs: 935, activationRate: 52.8, d1: 54.9, d7: 19.4, d30: 10.3, revenue: 1390, payingUsers: 58 },
      { installs: 960, activationRate: 53.1, d1: 55.2, d7: 19.7, d30: 10.6, revenue: 1435, payingUsers: 60 },
      { installs: 975, activationRate: 53.4, d1: 55.4, d7: 19.9, d30: 10.8, revenue: 1480, payingUsers: 61 },
      { installs: 992, activationRate: 53.8, d1: 55.6, d7: 20.1, d30: 11.0, revenue: 1520, payingUsers: 63 },
    ],
  },

  // ------------------------------------------------------------- under review
  {
    slug: "tempoclip",
    name: "TempoClip",
    tagline: "Beat-matched trimming for short-form video creators",
    audience: "Creators editing on phone between shoots",
    platforms: "ios,android",
    phase: "REVIEW",
    currentGate: "STORE_SUBMISSION",
    colorSeed: "violet",
    stages: [
      completedGate("MARKET_RESEARCH", 96, "Rao", researchDocs("tempoclip", "Rao", 18)),
      completedGate("PRD", 82, "Rao", prdDocs("Rao", 82)),
      completedGate("DESIGN", 68, "Imran", designDocs("Imran", 68)),
      completedGate("ANALYTICS_CATALOGUE", 62, "Rao", analyticsDoc("Rao", 62)),
      {
        gate: "BUILD",
        status: "COMPLETE",
        startedDaysAgo: 68,
        completedDaysAgo: 48,
        owner: "Hassan",
        documents: [
          { title: "Release candidate 1.0.0", docType: "APK_BUILD", owner: "Hassan", status: "APPROVED", version: "1.0.0", updatedDaysAgo: 22 },
        ],
      },
      {
        gate: "QA",
        status: "COMPLETE",
        startedDaysAgo: 48,
        completedDaysAgo: 22,
        owner: "Sana",
        documents: [
          { title: "QA sheet — cycles 1 to 5", docType: "QA_SHEET", owner: "Sana", status: "APPROVED", updatedDaysAgo: 22 },
        ],
        qaCycles: [
          { cycleNumber: 1, ranDaysAgo: 45, issuesFound: 61, issuesFixed: 61, issueRate: 44.2, devIssues: 38, designIssues: 18, prdIssues: 5, buildLabel: "0.9.1" },
          { cycleNumber: 2, ranDaysAgo: 40, issuesFound: 37, issuesFixed: 37, issueRate: 28.7, devIssues: 24, designIssues: 11, prdIssues: 2, buildLabel: "0.9.2" },
          { cycleNumber: 3, ranDaysAgo: 34, issuesFound: 21, issuesFixed: 21, issueRate: 17.3, devIssues: 15, designIssues: 6, prdIssues: 0, buildLabel: "0.9.3" },
          { cycleNumber: 4, ranDaysAgo: 28, issuesFound: 11, issuesFixed: 11, issueRate: 9.4, devIssues: 8, designIssues: 3, prdIssues: 0, buildLabel: "0.9.4" },
          { cycleNumber: 5, ranDaysAgo: 22, issuesFound: 5, issuesFixed: 5, issueRate: 4.1, devIssues: 5, designIssues: 0, prdIssues: 0, buildLabel: "1.0.0" },
        ],
      },
      {
        gate: "STORE_SUBMISSION",
        status: "BLOCKED",
        startedDaysAgo: 20,
        owner: "Rao",
        blockedReason: "App Store rejected 1.0.0 over subscription terms not shown before purchase.",
        documents: [
          { title: "Store listing copy and assets", docType: "STORE_LISTING", owner: "Rao", status: "APPROVED", updatedDaysAgo: 11 },
        ],
      },
      { gate: "LIVE", status: "NOT_STARTED" },
    ],
    submissions: [
      {
        platform: "APP_STORE",
        versionLabel: "1.0.0",
        submittedDaysAgo: 20,
        status: "REJECTED",
        decidedDaysAgo: 11,
        rejectionReason: "SUBSCRIPTION_DISCLOSURE",
        rejectionNotes:
          "Guideline 3.1.2 — price, billing period and renewal terms must be visible on the paywall itself, not behind a link.",
      },
      { platform: "PLAY_STORE", versionLabel: "1.0.0", submittedDaysAgo: 20, status: "IN_REVIEW" },
    ],
  },
  {
    slug: "planttrace",
    name: "PlantTrace",
    tagline: "Watering schedules that learn from how your plants actually respond",
    audience: "Houseplant collectors managing thirty-plus species",
    platforms: "android",
    phase: "REVIEW",
    currentGate: "STORE_SUBMISSION",
    colorSeed: "lime",
    stages: [
      completedGate("MARKET_RESEARCH", 120, "Rao", researchDocs("planttrace", "Rao", 27)),
      completedGate("PRD", 104, "Rao", prdDocs("Rao", 104)),
      completedGate("DESIGN", 88, "Imran", designDocs("Imran", 88)),
      completedGate("ANALYTICS_CATALOGUE", 82, "Rao", analyticsDoc("Rao", 82)),
      {
        gate: "BUILD",
        status: "COMPLETE",
        startedDaysAgo: 88,
        completedDaysAgo: 66,
        owner: "Hassan",
        documents: [
          { title: "Release candidate 1.0.0", docType: "APK_BUILD", owner: "Hassan", status: "APPROVED", version: "1.0.0", updatedDaysAgo: 30 },
        ],
      },
      {
        gate: "QA",
        status: "COMPLETE",
        startedDaysAgo: 66,
        completedDaysAgo: 30,
        owner: "Sana",
        documents: [
          { title: "QA sheet — cycles 1 to 5", docType: "QA_SHEET", owner: "Sana", status: "APPROVED", updatedDaysAgo: 30 },
        ],
        qaCycles: [
          { cycleNumber: 1, ranDaysAgo: 62, issuesFound: 44, issuesFixed: 44, issueRate: 36.1, devIssues: 27, designIssues: 14, prdIssues: 3, buildLabel: "0.9.0" },
          { cycleNumber: 2, ranDaysAgo: 54, issuesFound: 26, issuesFixed: 26, issueRate: 22.4, devIssues: 18, designIssues: 8, prdIssues: 0, buildLabel: "0.9.1" },
          { cycleNumber: 3, ranDaysAgo: 46, issuesFound: 14, issuesFixed: 14, issueRate: 12.2, devIssues: 10, designIssues: 4, prdIssues: 0, buildLabel: "0.9.2" },
          { cycleNumber: 4, ranDaysAgo: 38, issuesFound: 8, issuesFixed: 8, issueRate: 6.9, devIssues: 6, designIssues: 2, prdIssues: 0, buildLabel: "0.9.3" },
          { cycleNumber: 5, ranDaysAgo: 30, issuesFound: 3, issuesFixed: 3, issueRate: 2.6, devIssues: 3, designIssues: 0, prdIssues: 0, buildLabel: "1.0.0" },
        ],
      },
      {
        gate: "STORE_SUBMISSION",
        status: "IN_PROGRESS",
        startedDaysAgo: 6,
        owner: "Rao",
        notes: "Play Store review under way. Data safety form redone after the PlantTrace 0.9 rejection.",
        documents: [
          { title: "Store listing copy and assets", docType: "STORE_LISTING", owner: "Rao", status: "APPROVED", updatedDaysAgo: 6 },
        ],
      },
      { gate: "LIVE", status: "NOT_STARTED" },
    ],
    submissions: [
      {
        platform: "PLAY_STORE",
        versionLabel: "0.9.3",
        submittedDaysAgo: 26,
        status: "REJECTED",
        decidedDaysAgo: 21,
        rejectionReason: "DATA_SAFETY_FORM",
        rejectionNotes: "Data safety declaration did not list the location permission used for frost warnings.",
        resubmittedDaysAgo: 6,
      },
      { platform: "PLAY_STORE", versionLabel: "1.0.0", submittedDaysAgo: 6, status: "IN_REVIEW" },
    ],
  },

  // -------------------------------------------------------------- in production
  {
    slug: "cadencedeck",
    name: "CadenceDeck",
    tagline: "Practice logging and tempo drills for self-taught musicians",
    audience: "Adult learners practising without a teacher",
    platforms: "ios,android",
    phase: "PRODUCTION",
    currentGate: "QA",
    colorSeed: "amber",
    stages: [
      completedGate("MARKET_RESEARCH", 74, "Rao", researchDocs("cadencedeck", "Rao", 12)),
      completedGate("PRD", 58, "Rao", prdDocs("Rao", 58)),
      completedGate("DESIGN", 42, "Imran", designDocs("Imran", 42)),
      completedGate("ANALYTICS_CATALOGUE", 36, "Rao", analyticsDoc("Rao", 36)),
      {
        gate: "BUILD",
        status: "COMPLETE",
        startedDaysAgo: 42,
        completedDaysAgo: 24,
        owner: "Hassan",
        documents: [
          { title: "Debug build 0.8.4", docType: "APK_BUILD", owner: "Hassan", status: "APPROVED", version: "0.8.4", updatedDaysAgo: 5 },
        ],
      },
      {
        gate: "QA",
        status: "IN_PROGRESS",
        startedDaysAgo: 24,
        owner: "Sana",
        notes:
          "Cycle 5 still above the 10% line. Metronome drift on older Android hardware is driving most of it, and two design fixes came back out of spec.",
        documents: [
          { title: "QA sheet — cycle 5", docType: "QA_SHEET", owner: "Sana", status: "IN_REVIEW", updatedDaysAgo: 5 },
        ],
        qaCycles: [
          { cycleNumber: 1, ranDaysAgo: 22, issuesFound: 58, issuesFixed: 58, issueRate: 42.8, devIssues: 36, designIssues: 17, prdIssues: 5, buildLabel: "0.8.0" },
          { cycleNumber: 2, ranDaysAgo: 18, issuesFound: 34, issuesFixed: 34, issueRate: 27.9, devIssues: 22, designIssues: 10, prdIssues: 2, buildLabel: "0.8.1" },
          { cycleNumber: 3, ranDaysAgo: 14, issuesFound: 23, issuesFixed: 21, issueRate: 19.6, devIssues: 16, designIssues: 6, prdIssues: 1, buildLabel: "0.8.2" },
          { cycleNumber: 4, ranDaysAgo: 9, issuesFound: 17, issuesFixed: 15, issueRate: 14.2, devIssues: 11, designIssues: 5, prdIssues: 1, buildLabel: "0.8.3" },
          { cycleNumber: 5, ranDaysAgo: 5, issuesFound: 14, issuesFixed: 9, issueRate: 11.8, devIssues: 9, designIssues: 4, prdIssues: 1, buildLabel: "0.8.4" },
        ],
      },
      { gate: "STORE_SUBMISSION", status: "NOT_STARTED" },
      { gate: "LIVE", status: "NOT_STARTED" },
    ],
  },
  {
    slug: "routewright",
    name: "RouteWright",
    tagline: "Multi-day hiking routes with offline elevation and water points",
    audience: "Backcountry hikers planning unsupported trips",
    platforms: "ios,android",
    phase: "PRODUCTION",
    currentGate: "DESIGN",
    colorSeed: "rose",
    stages: [
      completedGate("MARKET_RESEARCH", 38, "Rao", researchDocs("routewright", "Rao", 9)),
      completedGate("PRD", 22, "Rao", prdDocs("Rao", 22)),
      {
        gate: "DESIGN",
        status: "IN_PROGRESS",
        startedDaysAgo: 21,
        owner: "Imran",
        notes:
          "Handover happened three weeks ago. Store graphics and the icon set have not been started, and there has been no file movement since the first review pass.",
        documents: [
          {
            title: "App UI/UX — core flows",
            docType: "FIGMA_APP_UI",
            owner: "Imran",
            status: "IN_REVIEW",
            version: "v1",
            summary: "Route planner and offline map screens. Trip journal not started.",
            updatedDaysAgo: 16,
          },
        ],
      },
      { gate: "ANALYTICS_CATALOGUE", status: "NOT_STARTED" },
      { gate: "BUILD", status: "NOT_STARTED" },
      { gate: "QA", status: "NOT_STARTED" },
      { gate: "STORE_SUBMISSION", status: "NOT_STARTED" },
      { gate: "LIVE", status: "NOT_STARTED" },
    ],
  },
];

type ExperimentSeed = {
  refId: string;
  product: string;
  title: string;
  category: "IN_APP" | "BUSINESS_DEV" | "PROMOTIONAL";
  surface: string;
  dimension: "ACQUISITION" | "ACTIVATION" | "RETENTION" | "MONETISATION";
  changeDescription: string;
  audience: string;
  expectedMetric: string;
  expectedDirection: "UP" | "DOWN";
  expectedSize: string;
  timeframe: string;
  rationale: string;
  primaryMetric: string;
  secondaryMetrics?: string;
  guardrailMetric?: string;
  minDetectableEffect?: string;
  killCriteria?: string;
  stopInDays?: number;
  stoppedDaysAgo?: number;
  minSampleSize?: number;
  ice?: [number, number, number];
  status: "BACKLOG" | "SCORED" | "READY" | "RUNNING" | "ANALYSIS" | "DECIDED" | "ARCHIVED";
  owner: string;
  startedDaysAgo?: number;
  endedDaysAgo?: number;
  variantSummary?: string;
  parentRef?: string;
  result?: {
    baselineValue: number;
    observedValue: number;
    deltaPercent: number;
    sampleSize?: number;
    guardrailBreached?: boolean;
    decision: "SHIP" | "ITERATE" | "KILL" | "INCONCLUSIVE";
    learning: string;
  };
};

const experiments: ExperimentSeed[] = [
  // LedgerLane — live, monetisation focus, with a decided parent and its child.
  {
    refId: "EXP-001",
    product: "ledgerlane",
    title: "Annual-first paywall ordering",
    category: "IN_APP",
    surface: "PAYWALL",
    dimension: "MONETISATION",
    changeDescription: "leading the paywall with the annual plan instead of monthly",
    audience: "users who hit the third receipt scan",
    expectedMetric: "trial start rate",
    expectedDirection: "UP",
    expectedSize: "by 12%",
    timeframe: "14 days",
    rationale:
      "three of the four competitors in the pricing scan lead with annual, and our monthly-first paywall has a 2.1% start rate against a category median near 4%",
    primaryMetric: "Trial start rate",
    secondaryMetrics: "Paywall view to purchase, ARPU",
    guardrailMetric: "D7 retention",
    minDetectableEffect: "8% relative",
    killCriteria: "Stop early if trial starts fall more than 5% or D7 drops below 14%.",
    stoppedDaysAgo: 4,
    minSampleSize: 2400,
    ice: [8, 7, 9],
    status: "DECIDED",
    owner: "Rao",
    startedDaysAgo: 25,
    endedDaysAgo: 4,
    variantSummary: "Control: monthly card first. Variant: annual card first with a saving badge.",
    result: {
      baselineValue: 2.1,
      observedValue: 2.7,
      deltaPercent: 28.6,
      sampleSize: 3140,
      decision: "SHIP",
      learning:
        "Ordering mattered more than price. The saving badge did the work — annual share of purchases went from 31% to 58% with no drop in total conversions.",
    },
  },
  {
    refId: "EXP-002",
    product: "ledgerlane",
    title: "Saving badge wording on the annual card",
    category: "IN_APP",
    surface: "PAYWALL",
    dimension: "MONETISATION",
    changeDescription: 'changing the badge from "Save 40%" to "2 months free"',
    audience: "users reaching the paywall after annual-first shipped",
    expectedMetric: "annual plan share",
    expectedDirection: "UP",
    expectedSize: "by 6%",
    timeframe: "14 days",
    rationale:
      "EXP-001 showed the badge carried the result, so the wording is the next lever worth isolating",
    primaryMetric: "Annual plan share of purchases",
    secondaryMetrics: "Trial start rate",
    guardrailMetric: "Refund rate",
    killCriteria: "Stop if refund rate rises above 3%.",
    stopInDays: 9,
    minSampleSize: 2000,
    ice: [5, 6, 9],
    status: "RUNNING",
    owner: "Rao",
    startedDaysAgo: 5,
    variantSummary: 'Control: "Save 40%". Variant: "2 months free".',
    parentRef: "EXP-001",
  },
  {
    refId: "EXP-003",
    product: "ledgerlane",
    title: "Reddit outreach in r/freelance during tax season",
    category: "BUSINESS_DEV",
    surface: "REDDIT",
    dimension: "ACQUISITION",
    changeDescription: "posting a genuinely useful expense-category guide with a soft mention",
    audience: "freelancers filing their own returns in January",
    expectedMetric: "weekly installs",
    expectedDirection: "UP",
    expectedSize: "by 300",
    timeframe: "3 weeks",
    rationale:
      "installs have fallen for eleven straight weeks and organic search is our only live channel",
    primaryMetric: "Weekly installs from web referrer",
    secondaryMetrics: "Install to activation rate",
    guardrailMetric: "D1 retention of the referred cohort",
    killCriteria: "Stop if the referred cohort lands under 40% D1, which would mean wrong-fit traffic.",
    stopInDays: 16,
    ice: [7, 5, 6],
    status: "READY",
    owner: "Rao",
  },
  {
    refId: "EXP-004",
    product: "ledgerlane",
    title: "Skip account creation until the first export",
    category: "IN_APP",
    surface: "ONBOARDING",
    dimension: "ACTIVATION",
    changeDescription: "deferring signup until the user tries to export a report",
    audience: "first-time users on the install day",
    expectedMetric: "activation rate",
    expectedDirection: "UP",
    expectedSize: "by 10%",
    timeframe: "21 days",
    rationale:
      "the funnel shows 23% of installs abandon on the signup screen before scanning a single receipt",
    primaryMetric: "Install to first scan",
    secondaryMetrics: "D1 retention",
    guardrailMetric: "Account creation rate over 30 days",
    ice: [9, 6, 4],
    status: "SCORED",
    owner: "Rao",
  },

  // Shutterproof — acquisition is the binding constraint.
  {
    refId: "EXP-005",
    product: "shutterproof",
    title: "Google CPI campaign against photography keywords",
    category: "PROMOTIONAL",
    surface: "GOOGLE_CPI",
    dimension: "ACQUISITION",
    changeDescription: "running a capped CPI campaign on high-intent photography keywords",
    audience: "Android users in the US, UK and Germany",
    expectedMetric: "weekly installs",
    expectedDirection: "UP",
    expectedSize: "to over 1000",
    timeframe: "3 weeks",
    rationale:
      "the app is 8 installs short of the weekly threshold and retention is already above target, so acquisition is the only thing keeping it off the keep list",
    primaryMetric: "Weekly installs",
    secondaryMetrics: "CPI, paid share of installs",
    guardrailMetric: "D1 retention of paid cohort",
    minDetectableEffect: "150 installs per week",
    killCriteria: "Kill if CPI exceeds $2.20 after 500 installs, or paid cohort D1 falls under 45%.",
    stopInDays: 11,
    minSampleSize: 500,
    ice: [8, 6, 7],
    status: "RUNNING",
    owner: "Rao",
    startedDaysAgo: 10,
    variantSummary: "Single campaign, three ad groups split by keyword intent.",
  },
  {
    refId: "EXP-006",
    product: "shutterproof",
    title: "Regional pricing for India and Brazil",
    category: "PROMOTIONAL",
    surface: "REGIONAL",
    dimension: "MONETISATION",
    changeDescription: "setting local price tiers at roughly 40% of the US price",
    audience: "users in India and Brazil",
    expectedMetric: "payer conversion in those regions",
    expectedDirection: "UP",
    expectedSize: "by 60%",
    timeframe: "28 days",
    rationale:
      "both regions are in the top five for installs and the bottom two for conversion, which usually means price rather than intent",
    primaryMetric: "Payer conversion rate, India and Brazil",
    secondaryMetrics: "Total revenue",
    guardrailMetric: "Blended ARPU",
    killCriteria: "Revert if blended ARPU falls more than 8%.",
    stopInDays: 27,
    ice: [7, 7, 8],
    status: "READY",
    owner: "Rao",
  },
  {
    refId: "EXP-007",
    product: "shutterproof",
    title: "Product Hunt launch with a lifetime deal for the first 200",
    category: "BUSINESS_DEV",
    surface: "PRODUCT_HUNT",
    dimension: "ACQUISITION",
    changeDescription: "launching on Product Hunt with a capped lifetime offer",
    audience: "the prosumer tool audience on launch day",
    expectedMetric: "weekly installs",
    expectedDirection: "UP",
    expectedSize: "by 800 in launch week",
    timeframe: "1 week",
    rationale: "the category does well on Product Hunt and we have never launched there",
    primaryMetric: "Weekly installs",
    secondaryMetrics: "Paying users added",
    guardrailMetric: "ARPU over 90 days",
    ice: [6, 4, 7],
    status: "BACKLOG",
    owner: "Rao",
  },
  {
    refId: "EXP-008",
    product: "shutterproof",
    title: "Screenshot order test on the store listing",
    category: "BUSINESS_DEV",
    surface: "ASO",
    dimension: "ACQUISITION",
    changeDescription: "leading with the batch-cull screen instead of the library view",
    audience: "store visitors arriving from search",
    expectedMetric: "product page conversion rate",
    expectedDirection: "UP",
    expectedSize: "by 15%",
    timeframe: "21 days",
    rationale:
      "the culling speed is the thing reviewers mention, but it is the fourth screenshot",
    primaryMetric: "Product page conversion rate",
    guardrailMetric: "D1 retention",
    ice: [6, 7, 9],
    status: "SCORED",
    owner: "Rao",
  },

  // TempoClip — blocked in review, so the pipeline is planning rather than running.
  {
    refId: "EXP-009",
    product: "tempoclip",
    title: "Three-step onboarding instead of seven",
    category: "IN_APP",
    surface: "ONBOARDING",
    dimension: "ACTIVATION",
    changeDescription: "cutting onboarding to three screens and asking for the music library later",
    audience: "first-time users at launch",
    expectedMetric: "onboarding completion",
    expectedDirection: "UP",
    expectedSize: "by 20%",
    timeframe: "14 days after launch",
    rationale:
      "the competitor teardown found the two best-retaining apps in the category ask for permissions after the first edit, not before",
    primaryMetric: "Onboarding completion rate",
    secondaryMetrics: "First edit completed",
    guardrailMetric: "Music library permission grant rate",
    ice: [8, 7, 5],
    status: "BACKLOG",
    owner: "Rao",
  },
  {
    refId: "EXP-010",
    product: "tempoclip",
    title: "Paywall after first export rather than on day three",
    category: "IN_APP",
    surface: "PAYWALL",
    dimension: "MONETISATION",
    changeDescription: "showing the paywall the moment the first export finishes",
    audience: "new users who complete an edit",
    expectedMetric: "trial start rate",
    expectedDirection: "UP",
    expectedSize: "by 25%",
    timeframe: "21 days after launch",
    rationale:
      "LedgerLane's EXP-001 showed intent peaks at the moment of value, and export is this app's equivalent moment",
    primaryMetric: "Trial start rate",
    guardrailMetric: "D7 retention",
    ice: [7, 6, 8],
    status: "BACKLOG",
    owner: "Rao",
  },

  // CadenceDeck — still in QA, but the growth thinking is already queued.
  {
    refId: "EXP-011",
    product: "cadencedeck",
    title: "Streak reminder at the user's own practice hour",
    category: "IN_APP",
    surface: "FEATURE",
    dimension: "RETENTION",
    changeDescription: "sending the daily reminder at the hour the user usually practises",
    audience: "users with at least three logged sessions",
    expectedMetric: "D7 retention",
    expectedDirection: "UP",
    expectedSize: "by 5 points",
    timeframe: "28 days after launch",
    rationale:
      "practice is habitual and fixed-time reminders are the most common complaint in competitor reviews",
    primaryMetric: "D7 retention",
    secondaryMetrics: "Sessions per active user",
    guardrailMetric: "Notification opt-out rate",
    ice: [8, 6, 6],
    status: "BACKLOG",
    owner: "Rao",
  },
  {
    refId: "EXP-012",
    product: "cadencedeck",
    title: "Instrument-specific ad groups",
    category: "PROMOTIONAL",
    surface: "AD_GROUP",
    dimension: "ACQUISITION",
    changeDescription: "splitting the campaign into guitar, piano and drums ad groups",
    audience: "search traffic for each instrument",
    expectedMetric: "cost per install",
    expectedDirection: "DOWN",
    expectedSize: "by 20%",
    timeframe: "21 days after launch",
    rationale: "one blended ad group hides which instrument actually converts",
    primaryMetric: "Cost per install",
    guardrailMetric: "Install volume",
    ice: [5, 6, 7],
    status: "BACKLOG",
    owner: "Rao",
  },
];

async function main() {
  // Environment bootstrap passes --if-empty so a rebuild never wipes real data.
  if (process.argv.includes("--if-empty")) {
    if (fs.existsSync(CLEARED_MARKER)) {
      console.log("Skipping seed: workspace was cleared for a fresh start.");
      return;
    }
    const existing = await db.product.count();
    if (existing > 0) {
      console.log(`Skipping seed: ${existing} products already present.`);
      return;
    }
  } else if (fs.existsSync(CLEARED_MARKER)) {
    fs.unlinkSync(CLEARED_MARKER);
    console.log("Removed the fresh-start marker. Demo data will be loaded.");
  }

  console.log("Resetting workspace data...");
  await db.brainMessage.deleteMany();
  await db.experimentResult.deleteMany();
  await db.experiment.deleteMany();
  await db.weeklyMetric.deleteMany();
  await db.storeSubmission.deleteMany();
  await db.qACycle.deleteMany();
  await db.documentLink.deleteMany();
  await db.stage.deleteMany();
  await db.product.deleteMany();

  const productIds = new Map<string, string>();

  for (const seed of products) {
    const product = await db.product.create({
      data: {
        slug: seed.slug,
        name: seed.name,
        tagline: seed.tagline,
        audience: seed.audience,
        platforms: seed.platforms,
        phase: seed.phase,
        currentGate: seed.currentGate,
        colorSeed: seed.colorSeed,
        minWeeklyInstalls: seed.minWeeklyInstalls ?? 1000,
        minD1: seed.minD1 ?? 55,
        minD7: seed.minD7 ?? 15,
        brief: seed.brief ?? null,
      },
    });
    productIds.set(seed.slug, product.id);

    // Every product carries all eight gates, so the pipeline rail is always whole.
    for (const gate of GATES) {
      const stageSeed = seed.stages.find((s) => s.gate === gate);

      // Prisma stamps @updatedAt with the seed time, which would make every stage
      // look touched today and defeat the stall rule. Date it from its own
      // newest artifact instead. Untouched gates are dated far back so they
      // never count as activity.
      const touchedDaysAgo = Math.min(
        ...[
          stageSeed?.completedDaysAgo,
          stageSeed?.startedDaysAgo,
          ...(stageSeed?.documents ?? []).map((doc) => doc.updatedDaysAgo),
          ...(stageSeed?.qaCycles ?? []).map((cycle) => cycle.ranDaysAgo),
        ].filter((value): value is number => value != null),
        400,
      );

      const stage = await db.stage.create({
        data: {
          productId: product.id,
          gate,
          status: stageSeed?.status ?? "NOT_STARTED",
          startedAt: stageSeed?.startedDaysAgo != null ? daysAgo(stageSeed.startedDaysAgo) : null,
          completedAt:
            stageSeed?.completedDaysAgo != null ? daysAgo(stageSeed.completedDaysAgo) : null,
          expectedDays: GATE_SPEC[gate].expectedDays,
          owner: stageSeed?.owner ?? null,
          blockedReason: stageSeed?.blockedReason ?? null,
          notes: stageSeed?.notes ?? null,
          updatedAt: daysAgo(touchedDaysAgo),
        },
      });

      for (const doc of stageSeed?.documents ?? []) {
        await db.documentLink.create({
          data: {
            stageId: stage.id,
            title: doc.title,
            docType: doc.docType,
            url:
              doc.docType.startsWith("FIGMA")
                ? figma(`${seed.slug}-${doc.docType.toLowerCase()}`)
                : doc.docType === "QA_SHEET"
                  ? sheet(`${seed.slug}-qa`)
                  : drive(`${seed.slug}-${doc.docType.toLowerCase()}`),
            owner: doc.owner,
            status: doc.status,
            version: doc.version ?? "v1",
            summary: doc.summary ?? null,
            updatedAt: daysAgo(doc.updatedDaysAgo),
          },
        });
      }

      for (const cycle of stageSeed?.qaCycles ?? []) {
        await db.qACycle.create({
          data: {
            stageId: stage.id,
            cycleNumber: cycle.cycleNumber,
            ranOn: daysAgo(cycle.ranDaysAgo),
            issuesFound: cycle.issuesFound,
            issuesFixed: cycle.issuesFixed,
            issueRate: cycle.issueRate,
            devIssues: cycle.devIssues,
            designIssues: cycle.designIssues,
            prdIssues: cycle.prdIssues,
            buildLabel: cycle.buildLabel,
            sheetUrl: sheet(`${seed.slug}-qa-${cycle.cycleNumber}`),
          },
        });
      }
    }

    for (const submission of seed.submissions ?? []) {
      await db.storeSubmission.create({
        data: {
          productId: product.id,
          platform: submission.platform,
          versionLabel: submission.versionLabel,
          submittedAt: daysAgo(submission.submittedDaysAgo),
          status: submission.status,
          decidedAt: submission.decidedDaysAgo != null ? daysAgo(submission.decidedDaysAgo) : null,
          rejectionReason: submission.rejectionReason ?? null,
          rejectionNotes: submission.rejectionNotes ?? null,
          resubmittedAt:
            submission.resubmittedDaysAgo != null ? daysAgo(submission.resubmittedDaysAgo) : null,
          updatedAt: daysAgo(
            submission.resubmittedDaysAgo ?? submission.decidedDaysAgo ?? submission.submittedDaysAgo,
          ),
        },
      });
    }

    // Metrics are written oldest first so the trend reads top to bottom.
    const metrics = seed.metrics ?? [];
    for (const [index, metric] of metrics.entries()) {
      await db.weeklyMetric.create({
        data: {
          productId: product.id,
          weekStart: weekStart(metrics.length - 1 - index),
          installs: metric.installs,
          activationRate: metric.activationRate,
          d1: metric.d1,
          d7: metric.d7,
          d30: metric.d30 ?? null,
          revenue: metric.revenue,
          payingUsers: metric.payingUsers,
        },
      });
    }
  }

  // Two passes so a child can point at a parent seeded later in the list.
  const experimentIds = new Map<string, string>();
  for (const seed of experiments) {
    const productId = productIds.get(seed.product);
    if (!productId) throw new Error(`Unknown product for experiment ${seed.refId}`);
    const created = await db.experiment.create({
      data: {
        refId: seed.refId,
        productId,
        title: seed.title,
        category: seed.category,
        surface: seed.surface,
        dimension: seed.dimension,
        changeDescription: seed.changeDescription,
        audience: seed.audience,
        expectedMetric: seed.expectedMetric,
        expectedDirection: seed.expectedDirection,
        expectedSize: seed.expectedSize,
        timeframe: seed.timeframe,
        rationale: seed.rationale,
        primaryMetric: seed.primaryMetric,
        secondaryMetrics: seed.secondaryMetrics ?? null,
        guardrailMetric: seed.guardrailMetric ?? null,
        minDetectableEffect: seed.minDetectableEffect ?? null,
        killCriteria: seed.killCriteria ?? null,
        stopDate:
          seed.stopInDays != null
            ? daysAhead(seed.stopInDays)
            : seed.stoppedDaysAgo != null
              ? daysAgo(seed.stoppedDaysAgo)
              : null,
        minSampleSize: seed.minSampleSize ?? null,
        iceImpact: seed.ice?.[0] ?? null,
        iceConfidence: seed.ice?.[1] ?? null,
        iceEase: seed.ice?.[2] ?? null,
        status: seed.status,
        owner: seed.owner,
        startedAt: seed.startedDaysAgo != null ? daysAgo(seed.startedDaysAgo) : null,
        endedAt: seed.endedDaysAgo != null ? daysAgo(seed.endedDaysAgo) : null,
        variantSummary: seed.variantSummary ?? null,
      },
    });
    experimentIds.set(seed.refId, created.id);

    if (seed.result) {
      await db.experimentResult.create({
        data: {
          experimentId: created.id,
          baselineValue: seed.result.baselineValue,
          observedValue: seed.result.observedValue,
          deltaPercent: seed.result.deltaPercent,
          sampleSize: seed.result.sampleSize ?? null,
          guardrailBreached: seed.result.guardrailBreached ?? false,
          decision: seed.result.decision,
          learning: seed.result.learning,
        },
      });
    }
  }

  for (const seed of experiments) {
    if (!seed.parentRef) continue;
    await db.experiment.update({
      where: { id: experimentIds.get(seed.refId)! },
      data: { parentId: experimentIds.get(seed.parentRef) ?? null },
    });
  }

  console.log(
    `Seeded ${products.length} products, ${experiments.length} experiments and their artifacts.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
