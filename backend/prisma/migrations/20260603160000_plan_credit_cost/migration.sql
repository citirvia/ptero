ALTER TABLE "Plan"
ADD COLUMN "creditCost" INTEGER NOT NULL DEFAULT 0;

UPDATE "Plan"
SET "creditCost" = GREATEST(
  1,
  CEIL(
    ("ramMb" / 1024.0) * 40
    + ("cpuPct" / 100.0) * 25
    + ("diskMb" / 1024.0 / 10.0) * 8
    + "dbCount" * 3
    + "backups" * 2
  )::INTEGER
);
