import { getCryptoQuotes } from "./coingecko";
import { getUsStockQuotes } from "./finnhub";
import { resolveMarket } from "./types";
import type { QuoteAsset, QuoteMap } from "./types";

export type { Quote, QuoteAsset, QuoteMap } from "./types";

/**
 * 依市場把資產分組（美股 / 加密貨幣），分別呼叫對應的報價來源後合併。
 * 任一來源失敗都不會影響其他來源（個別 try/catch）。
 * 兩者皆以美元計價。
 */
export async function getQuotesForAssets(
  assets: QuoteAsset[]
): Promise<QuoteMap> {
  const usSymbols: string[] = [];
  const cryptoSymbols: string[] = [];

  for (const asset of assets) {
    const symbol = asset.symbol.trim().toUpperCase();
    if (!symbol) continue;

    if (resolveMarket(asset) === "crypto") {
      cryptoSymbols.push(symbol);
    } else {
      usSymbols.push(symbol);
    }
  }

  const [usQuotes, cryptoQuotes] = await Promise.all([
    safeQuotes(() => getUsStockQuotes(usSymbols), "Finnhub"),
    safeQuotes(() => getCryptoQuotes(cryptoSymbols), "CoinGecko"),
  ]);

  return { ...usQuotes, ...cryptoQuotes };
}

async function safeQuotes(
  fn: () => Promise<QuoteMap>,
  sourceName: string
): Promise<QuoteMap> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(`[prices] ${sourceName} 報價取得失敗：${message}`);
    return {};
  }
}
