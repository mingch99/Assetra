export type AssetType = "Stock" | "Crypto";
export type AssetTab = "All" | "Stock" | "Crypto";

export type Asset = {
  name: string;
  symbol: string;
  type: AssetType;
  quantity: number;
  avgCost: number;
  currentPrice: number;
};

export type NewAsset = Omit<Asset, "symbol"> & {
  symbol: string;
};
