import { listAssets } from "@/lib/assets-store";
import { getPortfolioState } from "@/lib/portfolio-store";
import {
  alignSeriesToDates,
  getCryptoDailyCloses,
  getRangeWindow,
  getUsDailyCloses,
} from "@/lib/prices/history";
import { getCoinGeckoIdBySymbol } from "@/lib/prices/coingecko";
import type { HistoryRange } from "@/types/asset";

export type HistoryPoint = {
  date: string;
  value: number;
};

export type PortfolioHistoryResult = {
  range: HistoryRange;
  points: HistoryPoint[];
  warning?: string;
};

function enumerateDates(fromMs: number, toMs: number): string[] {
  const dates: string[] = [];
  const cursor = new Date(fromMs);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(toMs);
  end.setUTCHours(0, 0, 0, 0);

  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export async function buildPortfolioHistory(
  userId: string,
  range: HistoryRange
): Promise<PortfolioHistoryResult> {
  const [assets, portfolio] = await Promise.all([
    listAssets(userId),
    getPortfolioState(userId),
  ]);

  const { fromMs, toMs, days } = getRangeWindow(range);
  const dates = enumerateDates(fromMs, toMs);
  const fixedCash =
    portfolio.cashAmount + Math.max(0, portfolio.realEstateAmount);

  if (assets.length === 0) {
    return {
      range,
      points: dates.map((date) => ({ date, value: fixedCash })),
        warning:
          fixedCash > 0
            ? undefined
            : "No holdings yet — chart is empty.",
    };
  }

  const warnings: string[] = [];
  const perAssetSeries = await Promise.all(
    assets.map(async (asset) => {
      const symbol = asset.symbol.trim().toUpperCase();
      try {
        if (asset.type === "Crypto") {
          const coinId = getCoinGeckoIdBySymbol(symbol);
          if (!coinId) {
            warnings.push(`${symbol}: historical quotes not supported`);
            return { asset, closes: null as (number | null)[] | null };
          }
          const series = await getCryptoDailyCloses(coinId, days + 1);
          return { asset, closes: alignSeriesToDates(dates, series) };
        }

        const series = await getUsDailyCloses(symbol, fromMs, toMs);
        return { asset, closes: alignSeriesToDates(dates, series) };
      } catch {
        warnings.push(`${symbol}: failed to fetch history`);
        return { asset, closes: null };
      }
    })
  );

  const points: HistoryPoint[] = dates.map((date, index) => {
    let holdings = 0;
    for (const item of perAssetSeries) {
      if (!item.closes) {
        // Fallback to current/avg when history missing for that symbol.
        const price =
          item.asset.currentPrice > 0
            ? item.asset.currentPrice
            : item.asset.avgCost;
        holdings += price * item.asset.quantity;
        continue;
      }
      const close = item.closes[index];
      if (close === null || close === undefined) {
        const price =
          item.asset.currentPrice > 0
            ? item.asset.currentPrice
            : item.asset.avgCost;
        holdings += price * item.asset.quantity;
      } else {
        holdings += close * item.asset.quantity;
      }
    }
    return { date, value: holdings + fixedCash };
  });

  return {
    range,
    points,
    warning:
      warnings.length > 0
        ? `Incomplete history for: ${warnings.slice(0, 5).join("; ")}${
            warnings.length > 5 ? "…" : ""
          }. Reconstructed from current holdings; past trades are not reflected.`
        : "Reconstructed from current holdings; past trades are not reflected.",
  };
}

export function isHistoryRange(value: string): value is HistoryRange {
  return (
    value === "7d" ||
    value === "30d" ||
    value === "90d" ||
    value === "ytd" ||
    value === "1y"
  );
}
