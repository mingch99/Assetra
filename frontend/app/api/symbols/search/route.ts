import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { SUPPORTED_CRYPTO } from "@/lib/prices/coingecko";
import type { AssetType } from "@/types/asset";

type SymbolSearchResult = {
  symbol: string;
  name: string;
  type: AssetType;
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

function mapFinnhubType(type: string | undefined): AssetType | null {
  // Finnhub labels many US-listed foreign companies (e.g. TSM) as ADR.
  if (type === "Common Stock" || type === "ADR") return "Stock";
  if (type === "ETP" || type === "ETF") return "ETF";
  return null;
}

async function searchUsInstruments(query: string): Promise<SymbolSearchResult[]> {
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
    .map((item) => {
      const mappedType = mapFinnhubType(item.type);
      const symbol = (item.symbol ?? "").toUpperCase();
      if (!mappedType || !symbol || symbol.includes(".")) return null;
      return {
        symbol,
        name: item.description ?? item.symbol ?? "",
        type: mappedType,
      };
    })
    .filter((item): item is SymbolSearchResult => item !== null);
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

  const [cryptoResults, usResults] = await Promise.all([
    Promise.resolve(searchCrypto(query)),
    searchUsInstruments(query).catch(() => [] as SymbolSearchResult[]),
  ]);

  const results = [...cryptoResults, ...usResults].slice(0, MAX_RESULTS);
  return NextResponse.json({ data: results });
}
