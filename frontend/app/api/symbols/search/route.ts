import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { SUPPORTED_CRYPTO } from "@/lib/prices/coingecko";

type SymbolSearchResult = {
  symbol: string;
  name: string;
  type: "Stock" | "Crypto";
};

type FinnhubSearchResponse = {
  result?: Array<{
    symbol?: string;
    description?: string;
    type?: string;
  }>;
};

const FINNHUB_SEARCH_URL = "https://finnhub.io/api/v1/search";
const MAX_RESULTS = 25;

async function searchUsStocks(query: string): Promise<SymbolSearchResult[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  const url = `${FINNHUB_SEARCH_URL}?q=${encodeURIComponent(
    query
  )}&token=${apiKey}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as FinnhubSearchResponse;
  const results = data.result ?? [];

  return results
    .filter((item) => {
      const symbol = item.symbol ?? "";
      // 只保留普通股，並排除含「.」的非美股代號（Finnhub 免費僅美股可報價）。
      return (
        item.type === "Common Stock" &&
        symbol.length > 0 &&
        !symbol.includes(".")
      );
    })
    .map((item) => ({
      symbol: (item.symbol ?? "").toUpperCase(),
      name: item.description ?? item.symbol ?? "",
      type: "Stock" as const,
    }));
}

function searchCrypto(query: string): SymbolSearchResult[] {
  const lowerQuery = query.toLowerCase();
  return SUPPORTED_CRYPTO.filter(
    (coin) =>
      coin.symbol.toLowerCase().includes(lowerQuery) ||
      coin.name.toLowerCase().includes(lowerQuery)
  ).map((coin) => ({
    symbol: coin.symbol,
    name: coin.name,
    type: "Crypto" as const,
  }));
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (!query) {
    return NextResponse.json({ data: [] });
  }

  const [cryptoResults, stockResults] = await Promise.all([
    Promise.resolve(searchCrypto(query)),
    searchUsStocks(query).catch(() => [] as SymbolSearchResult[]),
  ]);

  // 加密貨幣優先顯示，再接美股，最後截斷數量。
  const results = [...cryptoResults, ...stockResults].slice(0, MAX_RESULTS);
  return NextResponse.json({ data: results });
}
