import type { AssetType } from "@/types/asset";
import { prisma } from "@/lib/prisma";
import {
  getCryptoDailyCloses,
  getRangeWindow,
  getUsDailyCloses,
} from "@/lib/prices/history";
import { getCoinGeckoIdBySymbol } from "@/lib/prices/coingecko";
import {
  computeMarketFeatures,
  newMarketRowId,
  type PriceBar,
} from "@/lib/market/features";

const MIN_BAR_COUNT = 200;
const MIN_SPAN_DAYS = 300;
const DAY_MS = 24 * 60 * 60 * 1000;

function toDateOnly(value: Date | string): Date {
  const iso = typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  return new Date(`${iso}T00:00:00.000Z`);
}

function isMarketType(type: AssetType): boolean {
  return type === "Stock" || type === "ETF" || type === "Crypto";
}

async function needsHistoryBackfill(symbol: string): Promise<boolean> {
  const agg = await prisma.dailyMarketPrice.aggregate({
    where: { symbol },
    _count: { _all: true },
    _min: { date: true },
    _max: { date: true },
  });

  if (agg._count._all < MIN_BAR_COUNT) return true;
  if (!agg._min.date || !agg._max.date) return true;

  const spanDays =
    (agg._max.date.getTime() - agg._min.date.getTime()) / DAY_MS;
  return spanDays < MIN_SPAN_DAYS;
}

async function fetchCloseSeries(
  symbol: string,
  type: AssetType
): Promise<Map<string, number>> {
  const { fromMs, toMs, days } = getRangeWindow("1y");

  if (type === "Crypto") {
    const coinId = getCoinGeckoIdBySymbol(symbol);
    if (!coinId) {
      console.warn(`[market] no CoinGecko id for ${symbol}`);
      return new Map();
    }
    return getCryptoDailyCloses(coinId, days);
  }

  return getUsDailyCloses(symbol, fromMs, toMs);
}

async function upsertDailyCloses(
  symbol: string,
  type: AssetType,
  series: Map<string, number>
): Promise<number> {
  if (series.size === 0) return 0;

  const source = type === "Crypto" ? "coingecko" : "finnhub";
  let count = 0;
  for (const [dateKey, close] of series) {
    if (!(close > 0)) continue;
    const date = toDateOnly(dateKey);
    await prisma.dailyMarketPrice.upsert({
      where: {
        symbol_date: { symbol, date },
      },
      create: {
        id: newMarketRowId("dmp"),
        symbol,
        date,
        open: close,
        high: close,
        low: close,
        close,
        adjClose: close,
        volume: BigInt(0),
        source,
      },
      update: {
        open: close,
        high: close,
        low: close,
        close,
        adjClose: close,
        source,
      },
    });
    count += 1;
  }
  return count;
}

async function recomputeFeaturesForSymbol(symbol: string): Promise<number> {
  const rows = await prisma.dailyMarketPrice.findMany({
    where: { symbol },
    orderBy: { date: "asc" },
    select: { date: true, close: true, adjClose: true },
  });

  const bars: PriceBar[] = rows.map((row) => ({
    date: row.date,
    close: row.close,
    adjClose: row.adjClose,
  }));
  const features = computeMarketFeatures(bars);
  const now = new Date();
  let count = 0;

  for (const feature of features) {
    await prisma.marketFeature.upsert({
      where: {
        symbol_date: { symbol, date: feature.date },
      },
      create: {
        id: newMarketRowId("mf"),
        symbol,
        date: feature.date,
        ma20: feature.ma20,
        return7d: feature.return7d,
        return30d: feature.return30d,
        returnYtd: feature.returnYtd,
        return1y: feature.return1y,
        volatility7d: feature.volatility7d,
        volatility30d: feature.volatility30d,
        volatilityYtd: feature.volatilityYtd,
        volatility1y: feature.volatility1y,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        ma20: feature.ma20,
        return7d: feature.return7d,
        return30d: feature.return30d,
        returnYtd: feature.returnYtd,
        return1y: feature.return1y,
        volatility7d: feature.volatility7d,
        volatility30d: feature.volatility30d,
        volatilityYtd: feature.volatilityYtd,
        volatility1y: feature.volatility1y,
        updatedAt: now,
      },
    });
    count += 1;
  }

  return count;
}

/**
 * Backfill ~1y daily prices when coverage is thin, then recompute MarketFeature.
 */
export async function ensureSymbolHistory(
  symbol: string,
  type: AssetType
): Promise<void> {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized || !isMarketType(type)) return;

  try {
    if (await needsHistoryBackfill(normalized)) {
      const series = await fetchCloseSeries(normalized, type);
      const upserted = await upsertDailyCloses(normalized, type, series);
      console.info(
        `[market] backfilled ${normalized}: ${upserted} daily row(s)`
      );
    }

    const featureCount = await recomputeFeaturesForSymbol(normalized);
    console.info(
      `[market] features ${normalized}: ${featureCount} row(s)`
    );
  } catch (error) {
    console.error(`[market] ensureSymbolHistory failed for ${normalized}`, error);
    throw error;
  }
}

export function scheduleEnsureSymbolHistory(
  symbol: string,
  type: AssetType
): void {
  void ensureSymbolHistory(symbol, type).catch((error) => {
    console.error(
      `[market] background ensure failed for ${symbol}`,
      error
    );
  });
}

/**
 * Delete shared market rows only when no Asset still references the symbol.
 */
export async function maybePurgeSymbolMarketData(
  symbol: string
): Promise<boolean> {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized || normalized.startsWith("CASH-")) return false;

  const remaining = await prisma.asset.count({
    where: { symbol: normalized },
  });
  if (remaining > 0) return false;

  await prisma.$transaction([
    prisma.marketFeature.deleteMany({ where: { symbol: normalized } }),
    prisma.dailyMarketPrice.deleteMany({ where: { symbol: normalized } }),
  ]);
  console.info(`[market] purged unused symbol ${normalized}`);
  return true;
}

export async function maybePurgeSymbolsMarketData(
  symbols: string[]
): Promise<void> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];
  for (const symbol of unique) {
    await maybePurgeSymbolMarketData(symbol);
  }
}
