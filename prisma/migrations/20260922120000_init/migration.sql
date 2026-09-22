-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "platforms" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "currentGate" TEXT NOT NULL,
    "colorSeed" TEXT NOT NULL DEFAULT 'slate',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "minWeeklyInstalls" INTEGER NOT NULL DEFAULT 1000,
    "minD1" DOUBLE PRECISION NOT NULL DEFAULT 55,
    "minD7" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "brief" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "gate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expectedDays" INTEGER NOT NULL,
    "owner" TEXT,
    "blockedReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLink" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QACycle" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "ranOn" TIMESTAMP(3) NOT NULL,
    "issuesFound" INTEGER NOT NULL,
    "issuesFixed" INTEGER NOT NULL,
    "issueRate" DOUBLE PRECISION NOT NULL,
    "devIssues" INTEGER NOT NULL DEFAULT 0,
    "designIssues" INTEGER NOT NULL DEFAULT 0,
    "prdIssues" INTEGER NOT NULL DEFAULT 0,
    "buildLabel" TEXT,
    "sheetUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QACycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSubmission" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "rejectionNotes" TEXT,
    "resubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyMetric" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "installs" INTEGER NOT NULL,
    "activationRate" DOUBLE PRECISION NOT NULL,
    "d1" DOUBLE PRECISION NOT NULL,
    "d7" DOUBLE PRECISION NOT NULL,
    "d30" DOUBLE PRECISION,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payingUsers" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'GA4',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "changeDescription" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "expectedMetric" TEXT NOT NULL,
    "expectedDirection" TEXT NOT NULL,
    "expectedSize" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "primaryMetric" TEXT NOT NULL,
    "secondaryMetrics" TEXT,
    "guardrailMetric" TEXT,
    "minDetectableEffect" TEXT,
    "killCriteria" TEXT,
    "stopDate" TIMESTAMP(3),
    "minSampleSize" INTEGER,
    "iceImpact" INTEGER,
    "iceConfidence" INTEGER,
    "iceEase" INTEGER,
    "status" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "variantSummary" TEXT,
    "assetUrl" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentResult" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "baselineValue" DOUBLE PRECISION NOT NULL,
    "observedValue" DOUBLE PRECISION NOT NULL,
    "deltaPercent" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER,
    "guardrailBreached" BOOLEAN NOT NULL DEFAULT false,
    "decision" TEXT NOT NULL,
    "learning" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainMessage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citations" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrainMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_phase_idx" ON "Product"("phase");

-- CreateIndex
CREATE INDEX "Stage_status_idx" ON "Stage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_productId_gate_key" ON "Stage"("productId", "gate");

-- CreateIndex
CREATE INDEX "DocumentLink_docType_idx" ON "DocumentLink"("docType");

-- CreateIndex
CREATE UNIQUE INDEX "QACycle_stageId_cycleNumber_key" ON "QACycle"("stageId", "cycleNumber");

-- CreateIndex
CREATE INDEX "StoreSubmission_platform_status_idx" ON "StoreSubmission"("platform", "status");

-- CreateIndex
CREATE INDEX "WeeklyMetric_weekStart_idx" ON "WeeklyMetric"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyMetric_productId_weekStart_key" ON "WeeklyMetric"("productId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_refId_key" ON "Experiment"("refId");

-- CreateIndex
CREATE INDEX "Experiment_status_idx" ON "Experiment"("status");

-- CreateIndex
CREATE INDEX "Experiment_dimension_idx" ON "Experiment"("dimension");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentResult_experimentId_key" ON "ExperimentResult"("experimentId");

-- CreateIndex
CREATE INDEX "BrainMessage_productId_createdAt_idx" ON "BrainMessage"("productId", "createdAt");

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QACycle" ADD CONSTRAINT "QACycle_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSubmission" ADD CONSTRAINT "StoreSubmission_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyMetric" ADD CONSTRAINT "WeeklyMetric_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Experiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentResult" ADD CONSTRAINT "ExperimentResult_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainMessage" ADD CONSTRAINT "BrainMessage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

