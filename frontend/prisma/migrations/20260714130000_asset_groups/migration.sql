-- Rename Basket -> AssetGroup (keeps ids / names)
ALTER TABLE "Basket" RENAME TO "AssetGroup";
ALTER INDEX "Basket_userId_idx" RENAME TO "AssetGroup_userId_idx";
ALTER TABLE "AssetGroup" RENAME CONSTRAINT "Basket_pkey" TO "AssetGroup_pkey";
ALTER TABLE "AssetGroup" RENAME CONSTRAINT "Basket_userId_fkey" TO "AssetGroup_userId_fkey";

-- Move membership onto Asset.groupId
ALTER TABLE "Asset" ADD COLUMN "groupId" TEXT;

UPDATE "Asset" AS a
SET "groupId" = bm."basketId"
FROM "BasketMember" AS bm
WHERE bm."assetId" = a."id";

DROP TABLE "BasketMember";

CREATE INDEX "Asset_groupId_idx" ON "Asset"("groupId");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "AssetGroup"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
