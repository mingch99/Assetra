import type { HistoryRange } from "@/types/asset";

export type PriceSeries = Map<string, number>; // date YYYY-MM-DD -> close

type FinnhubCandle = {
  s?: string;
  t?: number[];
  c?: number[];
};

type CoinGeckoMarketChart = {
  prices?: Array<[number, number]>;
};

const FINNHUB_CANDLE_URL = "https://finnhub.io/api/v1/stock/candle";

function toDateKey(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function getRangeWindow(range: HistoryRange): {
  fromMs: number;
  toMs: number;
  days: number;
} {
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  const toMs = to.getTime();

  if (range === "ytd") {
    const from = new Date(Date.UTC(to.getUTCFullYear(), 0, 1));
    return {
      fromMs: from.getTime(),
      toMs,
      days: Math.max(
        1,
        Math.ceil((toMs - from.getTime()) / (24 * 60 * 60 * 1000))
      ),
    };
  }

  const dayMap: Record<Exclude<HistoryRange, "ytd">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };
  const days = dayMap[range];
  const fromMs = toMs - days * 24 * 60 * 60 * 1000;
  return { fromMs, toMs, days };
}

export async function getUsDailyCloses(
  symbol: string,
  fromMs: number,
  toMs: number
): Promise<PriceSeries> {
  const series: PriceSeries = new Map();
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return series;

  const fromSec = Math.floor(fromMs / 1000);
  const toSec = Math.floor(toMs / 1000);
  const url = `${FINNHUB_CANDLE_URL}?symbol=${encodeURIComponent(
    symbol
  )}&resolution=D&from=${fromSec}&to=${toSec}&token=${apiKey}`;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return series;

  const data = (await response.json()) as FinnhubCandle;
  if (data.s !== "ok" || !data.t || !data.c) return series;

  for (let i = 0; i < data.t.length; i += 1) {
    const close = data.c[i];
    const ts = data.t[i];
    if (typeof close === "number" && close > 0 && typeof ts === "number") {
      series.set(toDateKey(ts * 1000), close);
    }
  }

  return series;
}

export async function getCryptoDailyCloses(
  coinId: string,
  days: number
): Promise<PriceSeries> {
  const series: PriceSeries = new Map();
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
    coinId
  )}/market_chart?vs_currency=usd&days=${Math.max(1, days)}`;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return series;

  const data = (await response.json()) as CoinGeckoMarketChart;
  for (const point of data.prices ?? []) {
    const [ms, price] = point;
    if (typeof ms === "number" && typeof price === "number" && price > 0) {
      series.set(toDateKey(ms), price);
    }
  }

  return series;
}

/** Forward-fill gaps using last known price. */
export function alignSeriesToDates(
  dates: string[],
  series: PriceSeries
): (number | null)[] {
  let last: number | null = null;
  return dates.map((date) => {
    const value = series.get(date);
    if (typeof value === "number") {
      last = value;
      return value;
    }
    return last;
  });
}
