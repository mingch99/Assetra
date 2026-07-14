import type { QuoteMap } from "./types";

// CoinGecko 的價格 API 需要用 coin id（symbol 不唯一），因此維護一份
// 「symbol / 名稱 / CoinGecko id」的對照表，搜尋與報價都以此為單一來源。
// 要支援更多幣種時，只需在這裡新增一筆（id 請對照 CoinGecko）。
type CoinDef = { symbol: string; name: string; id: string };

const SUPPORTED_COINS: CoinDef[] = [
  { symbol: "BTC", name: "Bitcoin", id: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", id: "ethereum" },
  { symbol: "USDT", name: "Tether", id: "tether" },
  { symbol: "BNB", name: "BNB", id: "binancecoin" },
  { symbol: "SOL", name: "Solana", id: "solana" },
  { symbol: "XRP", name: "XRP", id: "ripple" },
  { symbol: "USDC", name: "USD Coin", id: "usd-coin" },
  { symbol: "ADA", name: "Cardano", id: "cardano" },
  { symbol: "DOGE", name: "Dogecoin", id: "dogecoin" },
  { symbol: "TRX", name: "TRON", id: "tron" },
  { symbol: "TON", name: "Toncoin", id: "the-open-network" },
  { symbol: "AVAX", name: "Avalanche", id: "avalanche-2" },
  { symbol: "SHIB", name: "Shiba Inu", id: "shiba-inu" },
  { symbol: "DOT", name: "Polkadot", id: "polkadot" },
  { symbol: "LINK", name: "Chainlink", id: "chainlink" },
  { symbol: "BCH", name: "Bitcoin Cash", id: "bitcoin-cash" },
  { symbol: "MATIC", name: "Polygon", id: "matic-network" },
  { symbol: "LTC", name: "Litecoin", id: "litecoin" },
  { symbol: "NEAR", name: "NEAR Protocol", id: "near" },
  { symbol: "UNI", name: "Uniswap", id: "uniswap" },
  { symbol: "DAI", name: "Dai", id: "dai" },
  { symbol: "APT", name: "Aptos", id: "aptos" },
  { symbol: "ICP", name: "Internet Computer", id: "internet-computer" },
  { symbol: "ETC", name: "Ethereum Classic", id: "ethereum-classic" },
  { symbol: "XLM", name: "Stellar", id: "stellar" },
  { symbol: "ATOM", name: "Cosmos", id: "cosmos" },
  { symbol: "FIL", name: "Filecoin", id: "filecoin" },
  { symbol: "ARB", name: "Arbitrum", id: "arbitrum" },
  { symbol: "OP", name: "Optimism", id: "optimism" },
  { symbol: "VET", name: "VeChain", id: "vechain" },
  { symbol: "HBAR", name: "Hedera", id: "hedera-hashgraph" },
  { symbol: "INJ", name: "Injective", id: "injective-protocol" },
  { symbol: "SUI", name: "Sui", id: "sui" },
  { symbol: "GRT", name: "The Graph", id: "the-graph" },
  { symbol: "AAVE", name: "Aave", id: "aave" },
  { symbol: "MKR", name: "Maker", id: "maker" },
  { symbol: "ALGO", name: "Algorand", id: "algorand" },
  { symbol: "SAND", name: "The Sandbox", id: "the-sandbox" },
  { symbol: "MANA", name: "Decentraland", id: "decentraland" },
  { symbol: "PEPE", name: "Pepe", id: "pepe" },
  { symbol: "CRO", name: "Cronos", id: "crypto-com-chain" },
  {
    symbol: "PREOPAI",
    name: "OpenAI (Republic Pre-IPO)",
    id: "openai-republic-pre-ipo",
  },
];

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = Object.fromEntries(
  SUPPORTED_COINS.map((coin) => [coin.symbol, coin.id])
);

export function getCoinGeckoIdBySymbol(symbol: string): string | undefined {
  return SYMBOL_TO_COINGECKO_ID[symbol.trim().toUpperCase()];
}

// 可報價的加密貨幣清單（提供給搜尋下拉使用）。
export const SUPPORTED_CRYPTO: { symbol: string; name: string }[] =
  SUPPORTED_COINS.map(({ symbol, name }) => ({ symbol, name }));

const COINGECKO_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";

type SimplePriceResponse = Record<
  string,
  { usd?: number; usd_24h_change?: number }
>;

/**
 * 批次查詢加密貨幣的美元現價（近即時）。
 * 不在對照表中的 symbol 會被略過。
 */
export async function getCryptoQuotes(symbols: string[]): Promise<QuoteMap> {
  const quotes: QuoteMap = {};

  const idToSymbol = new Map<string, string>();
  for (const rawSymbol of symbols) {
    const symbol = rawSymbol.trim().toUpperCase();
    const id = SYMBOL_TO_COINGECKO_ID[symbol];
    if (id) idToSymbol.set(id, symbol);
  }

  const ids = [...idToSymbol.keys()];
  if (ids.length === 0) return quotes;

  const url = `${COINGECKO_PRICE_URL}?ids=${encodeURIComponent(
    ids.join(",")
  )}&vs_currencies=usd&include_24hr_change=true`;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`CoinGecko request failed with status ${response.status}`);
  }

  const data = (await response.json()) as SimplePriceResponse;
  for (const [id, payload] of Object.entries(data)) {
    const symbol = idToSymbol.get(id);
    if (symbol && typeof payload.usd === "number") {
      quotes[symbol] = {
        price: payload.usd,
        changePct:
          typeof payload.usd_24h_change === "number"
            ? payload.usd_24h_change
            : null,
      };
    }
  }

  return quotes;
}
