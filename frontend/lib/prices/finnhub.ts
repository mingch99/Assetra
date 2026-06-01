import type { QuoteMap } from "./types";

const FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote";

type FinnhubQuote = {
  c?: number; // current price
  dp?: number; // percent change
};

/**
 * 查詢美股現價（即時）。Finnhub 的 /quote 一次只能查一檔，
 * 因此對每個 symbol 併發查詢。免費方案約 60 calls/分鐘，
 * 一般使用者的持倉數量不會超過限制。
 *
 * 需要在 .env 設定 FINNHUB_API_KEY；未設定時回傳空結果並於 server log 提醒。
 */
export async function getUsStockQuotes(symbols: string[]): Promise<QuoteMap> {
  const quotes: QuoteMap = {};
  const uniqueSymbols = [
    ...new Set(symbols.map((symbol) => symbol.trim().toUpperCase())),
  ].filter(Boolean);

  if (uniqueSymbols.length === 0) return quotes;

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn(
      "[prices] 缺少 FINNHUB_API_KEY，跳過美股報價。請在 .env 設定後重新啟動。"
    );
    return quotes;
  }

  await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      try {
        const url = `${FINNHUB_QUOTE_URL}?symbol=${encodeURIComponent(
          symbol
        )}&token=${apiKey}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as FinnhubQuote;
        // Finnhub 對無效代號會回傳 c = 0，視為查無報價並略過。
        if (typeof data.c === "number" && data.c > 0) {
          quotes[symbol] = {
            price: data.c,
            changePct: typeof data.dp === "number" ? data.dp : null,
          };
        }
      } catch {
        // 單一代號失敗不影響其他代號。
      }
    })
  );

  return quotes;
}
