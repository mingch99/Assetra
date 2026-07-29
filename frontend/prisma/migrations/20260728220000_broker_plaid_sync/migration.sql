-- AlterEnum
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'Cash';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AssetSource" AS ENUM ('MANUAL', 'SYNCED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "BrokerConnectionStatus" AS ENUM ('ACTIVE', 'ERROR', 'DISCONNECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "BrokerConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "status" "BrokerConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerConnection_pkey" PRIMARY KEY ("id")
);

-- AlterTable Asset
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "connectionId" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "source" "AssetSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BrokerConnection_itemId_key" ON "BrokerConnection"("itemId");
CREATE INDEX IF NOT EXISTS "BrokerConnection_userId_idx" ON "BrokerConnection"("userId");
CREATE INDEX IF NOT EXISTS "Asset_connectionId_idx" ON "Asset"("connectionId");
CREATE INDEX IF NOT EXISTS "Asset_userId_source_type_idx" ON "Asset"("userId", "source", "type");

-- Unique on (userId, externalId) only when externalId is set (Postgres allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS "Asset_userId_externalId_key" ON "Asset"("userId", "externalId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "BrokerConnection" ADD CONSTRAINT "BrokerConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Asset" ADD CONSTRAINT "Asset_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BrokerConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
