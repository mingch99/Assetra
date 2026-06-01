import type { AssetType } from "@/types/asset";

export type Market = "us" | "crypto";

export type QuoteAsset = {
  symbol: string;
  type: AssetType;
};

export type Quote = {
  price: number;
  // 當日漲跌幅（%）。來源無法提供時為 null。
  changePct: number | null;
};

// symbol(大寫) -> 報價
export type QuoteMap = Record<string, Quote>;

/**
 * 判斷一個資產屬於哪個市場，決定要用哪個報價來源。
 * 目前只支援美股與加密貨幣。
 */
export function resolveMarket(asset: QuoteAsset): Market {
  return asset.type === "Crypto" ? "crypto" : "us";
}
