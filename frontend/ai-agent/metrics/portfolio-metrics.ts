import type {
  PortfolioAsset,
  PortfolioBasket,
  PortfolioMetrics,
  PortfolioState,
  QuoteMap,
} from "@/ai-agent/types";

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

function classifyCrypto(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  if (normalized === "BTC") return "BTC" as const;
  if (normalized === "ETH") return "ETH" as const;
  if (USD_STABLECOINS.has(normalized)) return "USD" as const;
  return "Altcoins" as const;
}

export function getEffectivePrice(asset: PortfolioAsset) {
  return asset.currentPrice > 0 ? asset.currentPrice : asset.avgCost;
}

export function computePortfolioMetrics(
  assets: PortfolioAsset[],
  portfolio: PortfolioState,
  quotes: QuoteMap = {},
  baskets: PortfolioBasket[] = []
): PortfolioMetrics {
  const { cashAmount, debtAmount, realEstateAmount } = portfolio;

  const assetsWithLivePrices = assets.map((asset) => {
    const live = quotes[asset.symbol.trim().toUpperCase()];
    return live ? { ...asset, currentPrice: live.price } : asset;
  });

  const totalMarketValue = assetsWithLivePrices.reduce(
    (sum, asset) => sum + getEffectivePrice(asset) * asset.quantity,
    0
  );
  const totalCostBasis = assetsWithLivePrices.reduce(
    (sum, asset) => sum + asset.avgCost * asset.quantity,
    0
  );
  const totalAssets = totalMarketValue + cashAmount + realEstateAmount;
  const unrealizedPnL = totalMarketValue - totalCostBasis;
  const unrealizedReturnPct =
    totalCostBasis === 0 ? 0 : (unrealizedPnL / totalCostBasis) * 100;

  const stockValue = assetsWithLivePrices
    .filter((asset) => asset.type === "Stock")
    .reduce((sum, asset) => sum + getEffectivePrice(asset) * asset.quantity, 0);
  const etfValue = assetsWithLivePrices
    .filter((asset) => asset.type === "ETF")
    .reduce((sum, asset) => sum + getEffectivePrice(asset) * asset.quantity, 0);
  const cryptoValue = assetsWithLivePrices
    .filter((asset) => asset.type === "Crypto")
    .reduce((sum, asset) => sum + getEffectivePrice(asset) * asset.quantity, 0);
  const syncedCashValue = assetsWithLivePrices
    .filter((asset) => asset.type === "Cash")
    .reduce((sum, asset) => sum + getEffectivePrice(asset) * asset.quantity, 0);
  const totalCash = cashAmount + syncedCashValue;

  const basketsValue = baskets.reduce((sum, basket) => sum + basket.marketValue, 0);

  const pct = (value: number) =>
    totalAssets === 0 ? 0 : (value / totalAssets) * 100;

  const debtRatioPct =
    totalAssets === 0
      ? debtAmount > 0
        ? 100
        : 0
      : Math.min((debtAmount / totalAssets) * 100, 100);
  const equityRatioPct = 100 - debtRatioPct;
  const netEquity = Math.max(totalAssets - debtAmount, 0);

  const cryptoBuckets = {
    BTC: 0,
    ETH: 0,
    USD: 0,
    Altcoins: 0,
  };
  for (const asset of assetsWithLivePrices.filter((item) => item.type === "Crypto")) {
    const key = classifyCrypto(asset.symbol);
    cryptoBuckets[key] += getEffectivePrice(asset) * asset.quantity;
  }

  const symbolToBasket = new Map<string, string>();
  for (const basket of baskets) {
    for (const symbol of basket.memberSymbols) {
      symbolToBasket.set(symbol.toUpperCase(), basket.name);
    }
  }

  const assetMetrics = assetsWithLivePrices.map((asset) => {
    const price = getEffectivePrice(asset);
    const marketValue = price * asset.quantity;
    const costBasis = asset.avgCost * asset.quantity;
    const assetUnrealizedPnL = marketValue - costBasis;
    const assetUnrealizedReturnPct =
      costBasis === 0 ? 0 : (assetUnrealizedPnL / costBasis) * 100;
    const quote = quotes[asset.symbol.trim().toUpperCase()];

    return {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      quantity: asset.quantity,
      avgCost: asset.avgCost,
      currentPrice: price,
      marketValue,
      costBasis,
      unrealizedPnL: assetUnrealizedPnL,
      unrealizedReturnPct: assetUnrealizedReturnPct,
      allocationPct: pct(marketValue),
      dailyChangePct: quote?.changePct ?? null,
      basketName: symbolToBasket.get(asset.symbol.trim().toUpperCase()) ?? null,
    };
  });

  return {
    cashAmount: totalCash,
    debtAmount,
    realEstateAmount,
    totalMarketValue,
    totalCostBasis,
    totalAssets,
    unrealizedPnL,
    unrealizedReturnPct,
    stockValue,
    etfValue,
    cryptoValue,
    basketsValue,
    stockAllocationPct: pct(stockValue),
    etfAllocationPct: pct(etfValue),
    cryptoAllocationPct: pct(cryptoValue),
    cashAllocationPct: pct(totalCash),
    realEstateAllocationPct: pct(realEstateAmount),
    liquidAssets: totalMarketValue + cashAmount,
    nonLiquidAssets: realEstateAmount,
    debtRatioPct,
    equityRatioPct,
    netEquity,
    cryptoBuckets,
    baskets,
    assets: assetMetrics.sort((a, b) => b.marketValue - a.marketValue),
  };
}
