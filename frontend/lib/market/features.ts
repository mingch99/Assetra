import { randomBytes } from "crypto";

const ANNUALIZATION = Math.sqrt(252);
/** ~1 trading year; Yahoo 1y bars are often ~251, so 250 keeps latest row fillable. */
const TRADING_DAYS_1Y = 250;

export type PriceBar = {
  date: Date;
  close: number;
  adjClose: number | null;
};

export type FeatureRow = {
  date: Date;
  ma20: number | null;
  return7d: number | null;
  return30d: number | null;
  returnYtd: number | null;
  return1y: number | null;
  volatility7d: number | null;
  volatility30d: number | null;
  volatilityYtd: number | null;
  volatility1y: number | null;
};

function effectivePrice(bar: PriceBar): number {
  return bar.adjClose != null && Number.isFinite(bar.adjClose) && bar.adjClose > 0
    ? bar.adjClose
    : bar.close;
}

function sampleStd(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function utcYear(date: Date): number {
  return date.getUTCFullYear();
}

function rollingVol(
  dailyReturns: Array<number | null>,
  endIndex: number,
  window: number
): number | null {
  if (endIndex + 1 < window) return null;
  const slice = dailyReturns
    .slice(endIndex - window + 1, endIndex + 1)
    .filter((value): value is number => value != null);
  if (slice.length < window) return null;
  const std = sampleStd(slice);
  return std == null ? null : std * ANNUALIZATION;
}

/** Match mle/scripts/compute_market_features.py trading-day windows. */
export function computeMarketFeatures(bars: PriceBar[]): FeatureRow[] {
  const sorted = [...bars].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const prices = sorted.map(effectivePrice);
  const dailyReturns: Array<number | null> = prices.map((price, index) => {
    if (index === 0) return null;
    const prev = prices[index - 1];
    if (!prev || prev <= 0 || !price || price <= 0) return null;
    return price / prev - 1;
  });

  // First index of each calendar year in the series.
  const ytdStartByYear = new Map<number, number>();
  sorted.forEach((bar, index) => {
    const year = utcYear(bar.date);
    if (!ytdStartByYear.has(year)) ytdStartByYear.set(year, index);
  });

  return sorted.map((bar, index) => {
    let ma20: number | null = null;
    if (index >= 19) {
      const window = prices.slice(index - 19, index + 1);
      if (window.every((price) => price > 0)) {
        ma20 = window.reduce((sum, price) => sum + price, 0) / 20;
      }
    }

    let return7d: number | null = null;
    if (index >= 7) {
      const prev = prices[index - 7];
      const curr = prices[index];
      if (prev > 0 && curr > 0) return7d = curr / prev - 1;
    }

    let return30d: number | null = null;
    if (index >= 30) {
      const prev = prices[index - 30];
      const curr = prices[index];
      if (prev > 0 && curr > 0) return30d = curr / prev - 1;
    }

    let return1y: number | null = null;
    if (index >= TRADING_DAYS_1Y) {
      const prev = prices[index - TRADING_DAYS_1Y];
      const curr = prices[index];
      if (prev > 0 && curr > 0) return1y = curr / prev - 1;
    }

    const ytdStart = ytdStartByYear.get(utcYear(bar.date)) ?? 0;
    let returnYtd: number | null = null;
    if (index > ytdStart) {
      const prev = prices[ytdStart];
      const curr = prices[index];
      if (prev > 0 && curr > 0) returnYtd = curr / prev - 1;
    }

    const volatility7d = rollingVol(dailyReturns, index, 7);
    const volatility30d = rollingVol(dailyReturns, index, 30);
    const volatility1y = rollingVol(dailyReturns, index, TRADING_DAYS_1Y);

    let volatilityYtd: number | null = null;
    if (index > ytdStart) {
      const window = dailyReturns
        .slice(ytdStart + 1, index + 1)
        .filter((value): value is number => value != null);
      if (window.length >= 2) {
        const std = sampleStd(window);
        if (std != null) volatilityYtd = std * ANNUALIZATION;
      }
    }

    return {
      date: bar.date,
      ma20,
      return7d,
      return30d,
      returnYtd,
      return1y,
      volatility7d,
      volatility30d,
      volatilityYtd,
      volatility1y,
    };
  });
}

export function newMarketRowId(prefix: "dmp" | "mf"): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}
