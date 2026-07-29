import { getMarketValue } from "@/lib/asset-categories";
import { prisma } from "@/lib/prisma";

export type PortfolioRiskMetrics = {
  asOf: string | null;
  return7d: number | null;
  return30d: number | null;
  returnYtd: number | null;
  return1y: number | null;
  volatility7d: number | null;
  volatility30d: number | null;
  volatilityYtd: number | null;
  volatility1y: number | null;
  coveredWeight: number;
  missingSymbols: string[];
};

type HoldingInput = {
  symbol: string;
  type: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
};

type FeatureSnapshot = {
  date: Date;
  return7d: number | null;
  return30d: number | null;
  returnYtd: number | null;
  return1y: number | null;
  volatility7d: number | null;
  volatility30d: number | null;
  volatilityYtd: number | null;
  volatility1y: number | null;
};

function emptyMetrics(
  missingSymbols: string[] = []
): PortfolioRiskMetrics {
  return {
    asOf: null,
    return7d: null,
    return30d: null,
    returnYtd: null,
    return1y: null,
    volatility7d: null,
    volatility30d: null,
    volatilityYtd: null,
    volatility1y: null,
    coveredWeight: 0,
    missingSymbols,
  };
}

function weightedMetric(
  rows: Array<{ value: number; feature: FeatureSnapshot }>,
  pick: (feature: FeatureSnapshot) => number | null
): number | null {
  let covered = 0;
  let sum = 0;
  for (const row of rows) {
    const metric = pick(row.feature);
    if (metric == null || !Number.isFinite(metric)) continue;
    covered += row.value;
    sum += row.value * metric;
  }
  return covered > 0 ? sum / covered : null;
}

export async function computePortfolioRisk(
  holdings: HoldingInput[]
): Promise<PortfolioRiskMetrics> {
  const marketHoldings = holdings.filter(
    (asset) =>
      asset.type === "Stock" || asset.type === "ETF" || asset.type === "Crypto"
  );

  if (marketHoldings.length === 0) {
    return emptyMetrics();
  }

  const symbols = [
    ...new Set(
      marketHoldings.map((asset) => asset.symbol.trim().toUpperCase())
    ),
  ];

  const latestBySymbol = new Map<string, FeatureSnapshot>();

  for (const symbol of symbols) {
    const row = await prisma.marketFeature.findFirst({
      where: { symbol },
      orderBy: { date: "desc" },
      select: {
        date: true,
        return7d: true,
        return30d: true,
        returnYtd: true,
        return1y: true,
        volatility7d: true,
        volatility30d: true,
        volatilityYtd: true,
        volatility1y: true,
      },
    });
    if (row) latestBySymbol.set(symbol, row);
  }

  let totalValue = 0;
  let coveredValue = 0;
  let asOf: Date | null = null;
  const missingSymbols: string[] = [];
  const weightedRows: Array<{ value: number; feature: FeatureSnapshot }> = [];

  for (const asset of marketHoldings) {
    const symbol = asset.symbol.trim().toUpperCase();
    const value = getMarketValue(asset);
    if (!(value > 0)) continue;
    totalValue += value;

    const feature = latestBySymbol.get(symbol);
    const usable = feature && feature.return7d != null;

    if (!usable || !feature) {
      missingSymbols.push(symbol);
      continue;
    }

    coveredValue += value;
    weightedRows.push({ value, feature });
    if (!asOf || feature.date > asOf) asOf = feature.date;
  }

  if (coveredValue <= 0) {
    return emptyMetrics([...new Set(missingSymbols)]);
  }

  return {
    asOf: asOf ? asOf.toISOString().slice(0, 10) : null,
    return7d: weightedMetric(weightedRows, (f) => f.return7d),
    return30d: weightedMetric(weightedRows, (f) => f.return30d),
    returnYtd: weightedMetric(weightedRows, (f) => f.returnYtd),
    return1y: weightedMetric(weightedRows, (f) => f.return1y),
    volatility7d: weightedMetric(weightedRows, (f) => f.volatility7d),
    volatility30d: weightedMetric(weightedRows, (f) => f.volatility30d),
    volatilityYtd: weightedMetric(weightedRows, (f) => f.volatilityYtd),
    volatility1y: weightedMetric(weightedRows, (f) => f.volatility1y),
    coveredWeight: totalValue > 0 ? coveredValue / totalValue : 0,
    missingSymbols: [...new Set(missingSymbols)],
  };
}
