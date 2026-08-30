ALTER TABLE "CustomTemplate"
ADD COLUMN "packageArchiveName" TEXT,
ADD COLUMN "packageStorageKey" TEXT,
ADD COLUMN "visiblePaths" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;

ALTER TABLE "ServerSubscription"
ADD COLUMN "templateId" TEXT,
ADD COLUMN "templateVisiblePaths" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
