import type { Asset, AssetGroup, CryptoBucket } from "@/types/asset";

const USD_STABLECOINS = new Set([
  "USDT",
  "USDC",
  "USDE",
  "DAI",
  "FDUSD",
  "TUSD",
  "USDP",
  "BUSD",
  "USD1",
  "PYUSD",
]);

export function getEffectivePrice(asset: {
  currentPrice: number;
  avgCost: number;
}) {
  return asset.currentPrice > 0 ? asset.currentPrice : asset.avgCost;
}

export function getMarketValue(asset: {
  currentPrice: number;
  avgCost: number;
  quantity: number;
}) {
  return getEffectivePrice(asset) * asset.quantity;
}

export function classifyCryptoSymbol(symbol: string): CryptoBucket {
  const normalized = symbol.trim().toUpperCase();
  if (normalized === "BTC") return "BTC";
  if (normalized === "ETH") return "ETH";
  if (USD_STABLECOINS.has(normalized)) return "USD";
  return "Altcoins";
}

export function sumAssetMarketValue(assets: Asset[], type?: Asset["type"]) {
  return assets
    .filter((asset) => (type ? asset.type === type : true))
    .reduce((sum, asset) => sum + getMarketValue(asset), 0);
}

export function getGroupMarketValue(assets: Asset[], groupId: string) {
  return assets
    .filter((asset) => asset.groupId === groupId)
    .reduce((sum, asset) => sum + getMarketValue(asset), 0);
}

/**
 * Build allocation slices for a subset of assets:
 * - assets in a group → one slice per group name (group total of those assets)
 * - ungrouped → one slice per asset (or crypto bucket when useCryptoBuckets)
 */
export function buildGroupedAllocationItems(
  assets: Asset[],
  groups: AssetGroup[],
  options?: { useCryptoBuckets?: boolean }
): Array<{ label: string; value: number }> {
  const groupNameById = new Map(groups.map((group) => [group.id, group.name]));
  const groupedTotals = new Map<string, number>();
  const ungrouped: Array<{ label: string; value: number }> = [];
  const cryptoBuckets: Record<CryptoBucket, number> = {
    BTC: 0,
    ETH: 0,
    USD: 0,
    Altcoins: 0,
  };

  for (const asset of assets) {
    const value = getMarketValue(asset);
    if (asset.groupId) {
      const key = asset.groupId;
      groupedTotals.set(key, (groupedTotals.get(key) ?? 0) + value);
      continue;
    }

    if (options?.useCryptoBuckets && asset.type === "Crypto") {
      const bucket = classifyCryptoSymbol(asset.symbol);
      cryptoBuckets[bucket] += value;
      continue;
    }

    ungrouped.push({ label: asset.symbol, value });
  }

  const items: Array<{ label: string; value: number }> = [
    ...[...groupedTotals.entries()].map(([groupId, value]) => ({
      label: groupNameById.get(groupId) ?? "Group",
      value,
    })),
  ];

  if (options?.useCryptoBuckets) {
    (Object.keys(cryptoBuckets) as CryptoBucket[]).forEach((key) => {
      if (cryptoBuckets[key] > 0) {
        items.push({ label: key, value: cryptoBuckets[key] });
      }
    });
  } else {
    items.push(...ungrouped);
  }

  return items;
}

export function computeLiquidNonLiquid(input: {
  assets: Asset[];
  cashAmount: number;
  realEstateAmount: number;
}) {
  const { assets, cashAmount, realEstateAmount } = input;
  const holdingsValue = assets.reduce(
    (sum, asset) => sum + getMarketValue(asset),
    0
  );
  const liquidAssets = holdingsValue + cashAmount;
  const nonLiquidAssets = Math.max(0, realEstateAmount);
  const totalAssets = liquidAssets + nonLiquidAssets;

  return {
    holdingsValue,
    liquidAssets,
    nonLiquidAssets,
    totalAssets,
  };
}
