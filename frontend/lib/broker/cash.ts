import type { Asset, AssetSource } from "@/types/asset";

/** Sum market value of synced Cash rows in the asset table. */
export function sumSyncedCashFromAssets(
  assets: Array<Pick<Asset, "type" | "source" | "quantity" | "currentPrice" | "avgCost">>
): number {
  return assets
    .filter((asset) => asset.type === "Cash" && asset.source === "SYNCED")
    .reduce((sum, asset) => {
      const price = asset.currentPrice > 0 ? asset.currentPrice : asset.avgCost;
      return sum + asset.quantity * (price > 0 ? price : 1);
    }, 0);
}

/**
 * Total cash shown in Summary = manual (User.cashAmount) + synced Cash assets.
 */
export function computeTotalCash(
  manualCashAmount: number,
  assets: Array<Pick<Asset, "type" | "source" | "quantity" | "currentPrice" | "avgCost">>
): number {
  return Math.max(0, manualCashAmount) + sumSyncedCashFromAssets(assets);
}

export function isSyncedAsset(source: AssetSource | string | null | undefined) {
  return source === "SYNCED";
}
