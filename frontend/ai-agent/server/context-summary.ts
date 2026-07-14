import { computePortfolioMetrics } from "@/ai-agent/metrics/portfolio-metrics";
import type {
  PortfolioAsset,
  PortfolioBasket,
  PortfolioMetrics,
  PortfolioState,
  QuoteMap,
} from "@/ai-agent/types";

export function buildContextSummary(
  assets: PortfolioAsset[],
  portfolio: PortfolioState,
  quotes: QuoteMap = {},
  baskets: PortfolioBasket[] = []
): string {
  const metrics = computePortfolioMetrics(assets, portfolio, quotes, baskets);
  return serializePortfolioMetrics(metrics);
}

export function serializePortfolioMetrics(metrics: PortfolioMetrics): string {
  const summary = {
    overview: {
      totalAssets: round(metrics.totalAssets),
      cash: round(metrics.cashAmount),
      debt: round(metrics.debtAmount),
      realEstate: round(metrics.realEstateAmount),
      netEquity: round(metrics.netEquity),
      unrealizedPnL: round(metrics.unrealizedPnL),
      unrealizedReturnPct: round(metrics.unrealizedReturnPct),
      liquidAssets: round(metrics.liquidAssets),
      nonLiquidAssets: round(metrics.nonLiquidAssets),
    },
    allocation: {
      stockPct: round(metrics.stockAllocationPct),
      etfPct: round(metrics.etfAllocationPct),
      cryptoPct: round(metrics.cryptoAllocationPct),
      cashPct: round(metrics.cashAllocationPct),
      realEstatePct: round(metrics.realEstateAllocationPct),
      stockValue: round(metrics.stockValue),
      etfValue: round(metrics.etfValue),
      cryptoValue: round(metrics.cryptoValue),
      basketsValue: round(metrics.basketsValue),
    },
    cryptoBuckets: {
      BTC: round(metrics.cryptoBuckets.BTC),
      ETH: round(metrics.cryptoBuckets.ETH),
      USD: round(metrics.cryptoBuckets.USD),
      Altcoins: round(metrics.cryptoBuckets.Altcoins),
    },
    baskets: metrics.baskets.map((basket) => ({
      name: basket.name,
      memberSymbols: basket.memberSymbols,
      marketValue: round(basket.marketValue),
      costBasis: round(basket.costBasis),
    })),
    leverage: {
      debtRatioPct: round(metrics.debtRatioPct),
      equityRatioPct: round(metrics.equityRatioPct),
    },
    holdings: metrics.assets.map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      basketName: asset.basketName,
      quantity: asset.quantity,
      avgCost: round(asset.avgCost),
      currentPrice: round(asset.currentPrice),
      marketValue: round(asset.marketValue),
      allocationPct: round(asset.allocationPct),
      unrealizedPnL: round(asset.unrealizedPnL),
      unrealizedReturnPct: round(asset.unrealizedReturnPct),
      dailyChangePct:
        asset.dailyChangePct !== null ? round(asset.dailyChangePct) : null,
    })),
    assetCount: metrics.assets.length,
    currency: "USD",
  };

  return JSON.stringify(summary, null, 2);
}

function round(value: number) {
  return Number(value.toFixed(2));
}
