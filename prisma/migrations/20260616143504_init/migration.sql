-- CreateTable
CREATE TABLE "JobSite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastCrawledAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CrawlTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "selectors" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "salary" TEXT,
    "location" TEXT,
    "experience" TEXT,
    "education" TEXT,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobPosting_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "JobSite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobPostingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default',
    "score" INTEGER NOT NULL,
    "matchReason" TEXT NOT NULL,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFavorited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchResult_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchResultId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_matchResultId_fkey" FOREIGN KEY ("matchResultId") REFERENCES "MatchResult" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "monitorFrequency" INTEGER NOT NULL DEFAULT 30,
    "minMatchScore" INTEGER NOT NULL DEFAULT 60,
    "notifyBrowser" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "emailAddress" TEXT,
    "emailPassword" TEXT,
    "emailHost" TEXT,
    "emailPort" INTEGER,
    "notifyWebhook" BOOLEAN NOT NULL DEFAULT false,
    "webhookUrl" TEXT,
    "webhookType" TEXT,
    "notifyWorkHoursOnly" BOOLEAN NOT NULL DEFAULT false,
    "notifyStartHour" INTEGER NOT NULL DEFAULT 9,
    "notifyEndHour" INTEGER NOT NULL DEFAULT 18,
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 30,
    "openaiApiKey" TEXT,
    "openaiBaseUrl" TEXT,
    "jobRequirements" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "locationCities" TEXT,
    "experienceLevel" TEXT,
    "educationLevel" TEXT,
    "bonusKeywords" TEXT,
    "excludeKeywords" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CrawlLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "jobsFound" INTEGER NOT NULL DEFAULT 0,
    "jobsNew" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrawlLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "JobSite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CrawlTemplate_domain_key" ON "CrawlTemplate"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_siteId_externalId_key" ON "JobPosting"("siteId", "externalId");
