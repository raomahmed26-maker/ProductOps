-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "minD1" REAL NOT NULL DEFAULT 55,
    "minD7" REAL NOT NULL DEFAULT 15,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "gate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "expectedDays" INTEGER NOT NULL,
    "owner" TEXT,
    "blockedReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentLink_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QACycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stageId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "ranOn" DATETIME NOT NULL,
    "issuesFound" INTEGER NOT NULL,
    "issuesFixed" INTEGER NOT NULL,
    "issueRate" REAL NOT NULL,
    "devIssues" INTEGER NOT NULL DEFAULT 0,
    "designIssues" INTEGER NOT NULL DEFAULT 0,
    "prdIssues" INTEGER NOT NULL DEFAULT 0,
    "buildLabel" TEXT,
    "sheetUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QACycle_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoreSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "decidedAt" DATETIME,
    "rejectionReason" TEXT,
    "rejectionNotes" TEXT,
    "resubmittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoreSubmission_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "installs" INTEGER NOT NULL,
    "activationRate" REAL NOT NULL,
    "d1" REAL NOT NULL,
    "d7" REAL NOT NULL,
    "d30" REAL,
    "revenue" REAL NOT NULL DEFAULT 0,
    "payingUsers" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'GA4',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyMetric_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "stopDate" DATETIME,
    "minSampleSize" INTEGER,
    "iceImpact" INTEGER,
    "iceConfidence" INTEGER,
    "iceEase" INTEGER,
    "status" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "variantSummary" TEXT,
    "assetUrl" TEXT,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experiment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Experiment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Experiment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExperimentResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experimentId" TEXT NOT NULL,
    "baselineValue" REAL NOT NULL,
    "observedValue" REAL NOT NULL,
    "deltaPercent" REAL NOT NULL,
    "sampleSize" INTEGER,
    "guardrailBreached" BOOLEAN NOT NULL DEFAULT false,
    "decision" TEXT NOT NULL,
    "learning" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExperimentResult_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
