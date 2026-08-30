-- Configurable one-time signup bonus credits

ALTER TABLE "User"
ADD COLUMN "signupBonusGrantedAt" TIMESTAMP(3);

ALTER TABLE "User"
ALTER COLUMN "creditBalance" SET DEFAULT 0;

CREATE TABLE "AppConfig" (
  "id" INTEGER NOT NULL,
  "signupBonusCredits" INTEGER NOT NULL DEFAULT 500,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AppConfig" ("id", "signupBonusCredits")
VALUES (1, 500)
ON CONFLICT ("id") DO NOTHING;
