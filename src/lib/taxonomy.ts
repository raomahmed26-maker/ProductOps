// The shared vocabulary for the whole workspace. Controlled lists live here so
// that filters, forms, seeds and roll-up reports can never drift apart.

export const PHASES = ["PRE_PRODUCTION", "PRODUCTION", "REVIEW", "POST_PRODUCTION"] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABEL: Record<Phase, string> = {
  PRE_PRODUCTION: "Pre-production",
  PRODUCTION: "Production",
  REVIEW: "Review",
  POST_PRODUCTION: "Post-production",
};

export const PHASE_BLURB: Record<Phase, string> = {
  PRE_PRODUCTION: "Validating the gap and writing it down",
  PRODUCTION: "Designing, instrumenting, building and hardening",
  REVIEW: "In the hands of App Store and Play Store reviewers",
  POST_PRODUCTION: "Live, measured weekly, and under experiment",
};

export const GATES = [
  "MARKET_RESEARCH",
  "PRD",
  "DESIGN",
  "ANALYTICS_CATALOGUE",
  "BUILD",
  "QA",
  "STORE_SUBMISSION",
  "LIVE",
] as const;
export type Gate = (typeof GATES)[number];

export const GATE_PHASE: Record<Gate, Phase> = {
  MARKET_RESEARCH: "PRE_PRODUCTION",
  PRD: "PRE_PRODUCTION",
  DESIGN: "PRODUCTION",
  ANALYTICS_CATALOGUE: "PRODUCTION",
  BUILD: "PRODUCTION",
  QA: "PRODUCTION",
  STORE_SUBMISSION: "REVIEW",
  LIVE: "POST_PRODUCTION",
};

export const PHASE_GATES: Record<Phase, Gate[]> = {
  PRE_PRODUCTION: ["MARKET_RESEARCH", "PRD"],
  PRODUCTION: ["DESIGN", "ANALYTICS_CATALOGUE", "BUILD", "QA"],
  REVIEW: ["STORE_SUBMISSION"],
  POST_PRODUCTION: ["LIVE"],
};

export type GateSpec = {
  label: string;
  short: string;
  /** What "done" means here, in one line. */
  intent: string;
  /** Your own cadence, used to age a stage rather than guess at it. */
  expectedDays: number;
  /** Doc types that must exist and be approved before the gate can close. */
  requiredDocTypes: DocType[];
};

export const GATE_SPEC: Record<Gate, GateSpec> = {
  MARKET_RESEARCH: {
    label: "Market research",
    short: "Research",
    intent: "The gap is evidenced and the competitive set is mapped.",
    expectedDays: 14,
    requiredDocTypes: [
      "MARKET_GAP",
      "COMPETITOR_CUMULATIVE",
      "COMPETITOR_UIUX",
      "COMPETITOR_PRICING",
    ],
  },
  PRD: {
    label: "PRD and policy docs",
    short: "PRD",
    intent: "Idea, value, features and implementation notes are written down, with the legal pack.",
    expectedDays: 10,
    requiredDocTypes: ["PRD", "PRIVACY_POLICY", "TOS"],
  },
  DESIGN: {
    label: "Figma design",
    short: "Design",
    intent: "App UI, store graphics and icons are designed, reviewed and revised.",
    expectedDays: 9,
    requiredDocTypes: ["FIGMA_APP_UI", "FIGMA_STORE_GRAPHICS", "FIGMA_APP_ICON"],
  },
  ANALYTICS_CATALOGUE: {
    label: "Analytics catalogue",
    short: "Analytics",
    intent: "User properties, events, parameters and values are specified for GA4 and PostHog.",
    expectedDays: 3,
    requiredDocTypes: ["ANALYTICS_CATALOGUE"],
  },
  BUILD: {
    label: "Build and debug APKs",
    short: "Build",
    intent: "The developer has shipped a debug build worth testing.",
    expectedDays: 8,
    requiredDocTypes: ["APK_BUILD"],
  },
  QA: {
    label: "QA cycles",
    short: "QA",
    intent: "At least five cycles run, with the latest issue rate under 10%.",
    expectedDays: 12,
    requiredDocTypes: ["QA_SHEET"],
  },
  STORE_SUBMISSION: {
    label: "Store submission",
    short: "Review",
    intent: "Submitted to both stores and through review without open rejections.",
    expectedDays: 10,
    requiredDocTypes: ["STORE_LISTING"],
  },
  LIVE: {
    label: "Live and measured",
    short: "Live",
    intent: "Weekly health review against the acquisition and retention thresholds.",
    expectedDays: 7,
    requiredDocTypes: [],
  },
};

export const DOC_TYPES = [
  "MARKET_GAP",
  "COMPETITOR_CUMULATIVE",
  "COMPETITOR_UIUX",
  "COMPETITOR_PRICING",
  "PRD",
  "PRIVACY_POLICY",
  "TOS",
  "FIGMA_APP_UI",
  "FIGMA_STORE_GRAPHICS",
  "FIGMA_APP_ICON",
  "ANALYTICS_CATALOGUE",
  "APK_BUILD",
  "QA_SHEET",
  "STORE_LISTING",
  "OTHER",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  MARKET_GAP: "Market gap validation",
  COMPETITOR_CUMULATIVE: "Competitive landscape",
  COMPETITOR_UIUX: "Competitor UI/UX teardown",
  COMPETITOR_PRICING: "Competitor pricing and positioning",
  PRD: "PRD",
  PRIVACY_POLICY: "Privacy policy",
  TOS: "Terms of service",
  FIGMA_APP_UI: "Figma — app UI/UX",
  FIGMA_STORE_GRAPHICS: "Figma — store graphics",
  FIGMA_APP_ICON: "Figma — app icon",
  ANALYTICS_CATALOGUE: "Analytics catalogue",
  APK_BUILD: "Debug build",
  QA_SHEET: "QA feedback sheet",
  STORE_LISTING: "Store listing",
  OTHER: "Other",
};

export const DOC_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED", "SUPERSEDED"] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  SUPERSEDED: "Superseded",
};

export const STAGE_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETE"] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

export const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
};

export const PLATFORMS = ["APP_STORE", "PLAY_STORE"] as const;
export type StorePlatform = (typeof PLATFORMS)[number];

export const PLATFORM_LABEL: Record<StorePlatform, string> = {
  APP_STORE: "App Store",
  PLAY_STORE: "Play Store",
};

export const SUBMISSION_STATUSES = [
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "RESUBMITTED",
  "LIVE",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RESUBMITTED: "Resubmitted",
  LIVE: "Live",
};

// Controlled vocabulary so recurring causes roll up across the portfolio instead
// of being retyped slightly differently every time.
export const REJECTION_REASONS = [
  "PRIVACY_DISCLOSURE",
  "DATA_SAFETY_FORM",
  "PAYMENTS_POLICY",
  "SUBSCRIPTION_DISCLOSURE",
  "MISLEADING_METADATA",
  "INCOMPLETE_INFORMATION",
  "BROKEN_FUNCTIONALITY",
  "DESIGN_GUIDELINES",
  "PERMISSIONS_JUSTIFICATION",
  "ACCOUNT_DELETION",
  "AGE_RATING",
  "OTHER",
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

export const REJECTION_REASON_LABEL: Record<RejectionReason, string> = {
  PRIVACY_DISCLOSURE: "Privacy disclosure mismatch",
  DATA_SAFETY_FORM: "Data safety form incomplete",
  PAYMENTS_POLICY: "Payments policy breach",
  SUBSCRIPTION_DISCLOSURE: "Subscription terms not disclosed",
  MISLEADING_METADATA: "Misleading metadata or screenshots",
  INCOMPLETE_INFORMATION: "Incomplete review information",
  BROKEN_FUNCTIONALITY: "Broken or incomplete functionality",
  DESIGN_GUIDELINES: "Design guideline violation",
  PERMISSIONS_JUSTIFICATION: "Permission not justified",
  ACCOUNT_DELETION: "Account deletion missing",
  AGE_RATING: "Age rating mismatch",
  OTHER: "Other",
};

export const DIMENSIONS = ["ACQUISITION", "ACTIVATION", "RETENTION", "MONETISATION"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABEL: Record<Dimension, string> = {
  ACQUISITION: "Acquisition",
  ACTIVATION: "Activation",
  RETENTION: "Retention",
  MONETISATION: "Monetisation",
};

export const DIMENSION_CLASS: Record<Dimension, string> = {
  ACQUISITION: "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25",
  ACTIVATION: "bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/25",
  RETENTION: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  MONETISATION: "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25",
};

export const DIMENSION_DOT: Record<Dimension, string> = {
  ACQUISITION: "bg-sky-500",
  ACTIVATION: "bg-violet-500",
  RETENTION: "bg-emerald-500",
  MONETISATION: "bg-amber-500",
};

export const EXPERIMENT_CATEGORIES = ["IN_APP", "BUSINESS_DEV", "PROMOTIONAL"] as const;
export type ExperimentCategory = (typeof EXPERIMENT_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<ExperimentCategory, string> = {
  IN_APP: "In-app",
  BUSINESS_DEV: "Business development",
  PROMOTIONAL: "Promotional",
};

export const SURFACES = [
  "PAYWALL",
  "PRICING",
  "ONBOARDING",
  "FEATURE",
  "UI_UX",
  "PRODUCT_HUNT",
  "REDDIT",
  "COMMUNITY",
  "GOOGLE_CPI",
  "REGIONAL",
  "AD_GROUP",
  "ASO",
  "OTHER",
] as const;
export type Surface = (typeof SURFACES)[number];

export const SURFACE_LABEL: Record<Surface, string> = {
  PAYWALL: "Paywall",
  PRICING: "Pricing",
  ONBOARDING: "Onboarding",
  FEATURE: "Feature",
  UI_UX: "UI/UX",
  PRODUCT_HUNT: "Product Hunt",
  REDDIT: "Reddit outreach",
  COMMUNITY: "Community",
  GOOGLE_CPI: "Google CPI campaign",
  REGIONAL: "Regional targeting",
  AD_GROUP: "Ad group",
  ASO: "App store optimisation",
  OTHER: "Other",
};

export const CATEGORY_SURFACES: Record<ExperimentCategory, Surface[]> = {
  IN_APP: ["PAYWALL", "PRICING", "ONBOARDING", "FEATURE", "UI_UX"],
  BUSINESS_DEV: ["PRODUCT_HUNT", "REDDIT", "COMMUNITY", "ASO"],
  PROMOTIONAL: ["GOOGLE_CPI", "REGIONAL", "AD_GROUP"],
};

export const EXPERIMENT_STATUSES = [
  "BACKLOG",
  "SCORED",
  "READY",
  "RUNNING",
  "ANALYSIS",
  "DECIDED",
  "ARCHIVED",
] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const EXPERIMENT_STATUS_LABEL: Record<ExperimentStatus, string> = {
  BACKLOG: "Backlog",
  SCORED: "Scored",
  READY: "Ready to launch",
  RUNNING: "Running",
  ANALYSIS: "In analysis",
  DECIDED: "Decided",
  ARCHIVED: "Archived",
};

export const DECISIONS = ["SHIP", "ITERATE", "KILL", "INCONCLUSIVE"] as const;
export type Decision = (typeof DECISIONS)[number];

export const DECISION_LABEL: Record<Decision, string> = {
  SHIP: "Ship",
  ITERATE: "Iterate",
  KILL: "Kill",
  INCONCLUSIVE: "Inconclusive",
};

export function isPhase(value: string): value is Phase {
  return (PHASES as readonly string[]).includes(value);
}

export function isGate(value: string): value is Gate {
  return (GATES as readonly string[]).includes(value);
}
