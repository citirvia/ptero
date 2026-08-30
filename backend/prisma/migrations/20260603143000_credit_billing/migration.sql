-- Credit-based billing system

CREATE TYPE "CreditLedgerType" AS ENUM (
  'INITIAL_GRANT',
  'MANUAL_ADJUSTMENT',
  'DEPLOYMENT_CHARGE',
  'MONTHLY_RENEWAL',
  'REFUND'
);

CREATE TYPE "ServerBillingStatus" AS ENUM (
  'ACTIVE',
  'GRACE',
  'SUSPENDED',
  'CANCELLED'
);

ALTER TABLE "User"
ADD COLUMN "creditBalance" INTEGER NOT NULL DEFAULT 500;

CREATE TABLE "CreditLedger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "type" "CreditLedgerType" NOT NULL,
  "description" TEXT,
  "serverIdentifier" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServerSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "serverIdentifier" TEXT NOT NULL,
  "pteroServerId" INTEGER NOT NULL,
  "serverName" TEXT NOT NULL,
  "memoryMb" INTEGER NOT NULL,
  "cpuPct" INTEGER NOT NULL,
  "diskMb" INTEGER NOT NULL,
  "databases" INTEGER NOT NULL DEFAULT 0,
  "backups" INTEGER NOT NULL DEFAULT 0,
  "allocations" INTEGER NOT NULL DEFAULT 1,
  "monthlyCredits" INTEGER NOT NULL,
  "status" "ServerBillingStatus" NOT NULL DEFAULT 'ACTIVE',
  "renewalAt" TIMESTAMP(3) NOT NULL,
  "graceEndsAt" TIMESTAMP(3),
  "lastChargedAt" TIMESTAMP(3),
  "suspendedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ServerSubscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CreditLedger_userId_createdAt_idx" ON "CreditLedger"("userId", "createdAt" DESC);
CREATE INDEX "CreditLedger_serverIdentifier_createdAt_idx" ON "CreditLedger"("serverIdentifier", "createdAt" DESC);
CREATE INDEX "ServerSubscription_userId_status_idx" ON "ServerSubscription"("userId", "status");
CREATE INDEX "ServerSubscription_status_renewalAt_idx" ON "ServerSubscription"("status", "renewalAt");

CREATE UNIQUE INDEX "ServerSubscription_serverIdentifier_key" ON "ServerSubscription"("serverIdentifier");
CREATE UNIQUE INDEX "ServerSubscription_pteroServerId_key" ON "ServerSubscription"("pteroServerId");

ALTER TABLE "CreditLedger"
ADD CONSTRAINT "CreditLedger_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServerSubscription"
ADD CONSTRAINT "ServerSubscription_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
