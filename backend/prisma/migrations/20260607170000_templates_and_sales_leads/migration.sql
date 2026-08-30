-- Real custom templates, template submissions, and enterprise sales leads

CREATE TYPE "TemplateSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SalesLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'SPAM');

CREATE TABLE "CustomTemplate" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "runtime" TEXT NOT NULL,
  "framework" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL,
  "deploys" INTEGER NOT NULL DEFAULT 0,
  "stars" INTEGER NOT NULL DEFAULT 0,
  "author" TEXT NOT NULL,
  "official" BOOLEAN NOT NULL DEFAULT false,
  "popular" BOOLEAN NOT NULL DEFAULT false,
  "abbr" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "eggId" INTEGER,
  "nestId" INTEGER,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CustomTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TemplateSubmission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "runtime" TEXT NOT NULL,
  "framework" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL,
  "repoUrl" TEXT NOT NULL,
  "notes" TEXT,
  "status" "TemplateSubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TemplateSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesLead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "teamSize" TEXT NOT NULL,
  "message" TEXT,
  "status" "SalesLeadStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SalesLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomTemplate_slug_key" ON "CustomTemplate"("slug");
CREATE INDEX "CustomTemplate_published_createdAt_idx" ON "CustomTemplate"("published", "createdAt" DESC);
CREATE INDEX "TemplateSubmission_userId_createdAt_idx" ON "TemplateSubmission"("userId", "createdAt" DESC);
CREATE INDEX "TemplateSubmission_status_createdAt_idx" ON "TemplateSubmission"("status", "createdAt" DESC);
CREATE INDEX "SalesLead_status_createdAt_idx" ON "SalesLead"("status", "createdAt" DESC);
CREATE INDEX "SalesLead_email_createdAt_idx" ON "SalesLead"("email", "createdAt" DESC);

ALTER TABLE "TemplateSubmission"
ADD CONSTRAINT "TemplateSubmission_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
