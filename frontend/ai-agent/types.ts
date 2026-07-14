export type AssetType = "Stock" | "ETF" | "Crypto";

export type AgentMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PortfolioAsset = {
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  avgCost: number;
  currentPrice: number;
};

export type PortfolioBasket = {
  name: string;
  memberSymbols: string[];
  marketValue: number;
  costBasis: number;
};

export type PortfolioState = {
  cashAmount: number;
  debtAmount: number;
  realEstateAmount: number;
};

export type QuoteMap = Record<
  string,
  { price: number; changePct?: number | null }
>;

export type AssetMetric = {
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedReturnPct: number;
  allocationPct: number;
  dailyChangePct: number | null;
  basketName: string | null;
};

export type PortfolioMetrics = {
  cashAmount: number;
  debtAmount: number;
  realEstateAmount: number;
  totalMarketValue: number;
  totalCostBasis: number;
  totalAssets: number;
  unrealizedPnL: number;
  unrealizedReturnPct: number;
  stockValue: number;
  etfValue: number;
  cryptoValue: number;
  basketsValue: number;
  stockAllocationPct: number;
  etfAllocationPct: number;
  cryptoAllocationPct: number;
  cashAllocationPct: number;
  realEstateAllocationPct: number;
  liquidAssets: number;
  nonLiquidAssets: number;
  debtRatioPct: number;
  equityRatioPct: number;
  netEquity: number;
  cryptoBuckets: {
    BTC: number;
    ETH: number;
    USD: number;
    Altcoins: number;
  };
  baskets: PortfolioBasket[];
  assets: AssetMetric[];
};

export type AgentConfig = {
  apiKey: string;
  model: string;
};
