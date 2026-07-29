import { buildContextSummary } from "@/ai-agent/server/context-summary";
import type { PortfolioBasket } from "@/ai-agent/types";
import { getGroupMarketValue } from "@/lib/asset-categories";
import { listAssets } from "@/lib/assets-store";
import { listGroups } from "@/lib/groups-store";
import { getPortfolioState } from "@/lib/portfolio-store";
import { getQuotesForAssets } from "@/lib/prices";

/**
 * Assetra 主程式 → AI Agent 的接合層。
 */
export async function loadPortfolioContextForAiAgent(
  userId: string
): Promise<string> {
  const [assets, portfolio, groups] = await Promise.all([
    listAssets(userId),
    getPortfolioState(userId),
    listGroups(userId),
  ]);

  const quotes = await getQuotesForAssets(
    assets
      .filter((asset) => asset.type !== "Cash")
      .map((asset) => ({ symbol: asset.symbol, type: asset.type }))
  );

  const pricedAssets = assets.map((asset) => {
    const live = quotes[asset.symbol.trim().toUpperCase()];
    return live ? { ...asset, currentPrice: live.price } : asset;
  });

  const agentGroups: PortfolioBasket[] = groups.map((group) => {
    const members = pricedAssets.filter((asset) => asset.groupId === group.id);
    return {
      name: group.name,
      memberSymbols: members.map((asset) => asset.symbol),
      marketValue: getGroupMarketValue(pricedAssets, group.id),
      costBasis: members.reduce(
        (sum, asset) => sum + asset.avgCost * asset.quantity,
        0
      ),
    };
  });

  return buildContextSummary(pricedAssets, portfolio, quotes, agentGroups);
}
