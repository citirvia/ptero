CREATE TYPE "PromoCodeType" AS ENUM ('FIXED_CREDITS', 'PERCENT');

ALTER TABLE "ServerSubscription"
ADD COLUMN "originalMonthlyCredits" INTEGER,
ADD COLUMN "initialPromoCode" TEXT,
ADD COLUMN "initialDiscountCredits" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "PromoCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT,
  "description" TEXT,
  "type" "PromoCodeType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "maxRedemptions" INTEGER,
  "maxPerUser" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoRedemption" (
  "id" TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "serverSubscriptionId" TEXT,
  "planId" TEXT,
  "serverIdentifier" TEXT,
  "discountCredits" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_active_expiresAt_idx" ON "PromoCode"("active", "expiresAt");
CREATE INDEX "PromoCode_code_active_idx" ON "PromoCode"("code", "active");
CREATE INDEX "PromoRedemption_promoCodeId_createdAt_idx" ON "PromoRedemption"("promoCodeId", "createdAt" DESC);
CREATE INDEX "PromoRedemption_userId_createdAt_idx" ON "PromoRedemption"("userId", "createdAt" DESC);
CREATE INDEX "PromoRedemption_serverSubscriptionId_idx" ON "PromoRedemption"("serverSubscriptionId");

ALTER TABLE "PromoRedemption"
ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey"
FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PromoRedemption"
ADD CONSTRAINT "PromoRedemption_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
