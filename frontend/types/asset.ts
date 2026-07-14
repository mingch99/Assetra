export type AssetType = "Stock" | "ETF" | "Crypto";
export type AssetTab = "All" | "Stock" | "ETF" | "Crypto";
export type CryptoBucket = "BTC" | "ETH" | "USD" | "Altcoins";
export type HistoryRange = "7d" | "30d" | "90d" | "ytd" | "1y";

export type AssetGroup = {
  id: string;
  name: string;
};

export type Asset = {
  id: string;
  name: string;
  symbol: string;
  type: AssetType;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  groupId: string | null;
  group?: AssetGroup | null;
};

export type NewAsset = Omit<Asset, "id" | "group" | "groupId"> & {
  groupId?: string | null;
};

export type NewAssetGroup = {
  name: string;
};
