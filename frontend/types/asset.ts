export type AssetType = "Stock" | "ETF" | "Crypto" | "Cash";
export type AssetSource = "MANUAL" | "SYNCED";
export type AssetTab = "All" | "Stock" | "ETF" | "Crypto" | "Cash";
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
  source: AssetSource;
  externalId: string | null;
  connectionId: string | null;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  groupId: string | null;
  group?: AssetGroup | null;
};

export type NewAsset = Omit<
  Asset,
  "id" | "group" | "groupId" | "source" | "externalId" | "connectionId"
> & {
  groupId?: string | null;
  source?: AssetSource;
  externalId?: string | null;
  connectionId?: string | null;
};

export type NewAssetGroup = {
  name: string;
};

export type BrokerConnectionSummary = {
  id: string;
  institutionId: string | null;
  institutionName: string | null;
  status: "ACTIVE" | "ERROR" | "DISCONNECTED";
  lastSyncedAt: string | null;
  lastError: string | null;
  createdAt: string;
};
