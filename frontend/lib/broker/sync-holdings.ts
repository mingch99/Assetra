import type { AssetType } from "@/types/asset";
import { prisma } from "@/lib/prisma";
import {
  fetchPlaidInstitution,
  fetchPlaidInvestmentsHoldings,
  fetchPlaidItem,
} from "@/lib/broker/plaid-client";
import { decryptBrokerToken } from "@/lib/broker/token-crypto";
import {
  maybePurgeSymbolsMarketData,
  scheduleEnsureSymbolHistory,
} from "@/lib/market/symbol-lifecycle";

type MappedHolding = {
  externalId: string;
  name: string;
  symbol: string;
  type: AssetType;
  quantity: number;
  avgCost: number;
  currentPrice: number;
};

function mapSecurityType(
  securityType: string | null | undefined,
  ticker: string | null | undefined,
  isCashEquivalent: boolean | null | undefined
): AssetType | null {
  if (isCashEquivalent) return "Cash";

  const type = (securityType ?? "").toLowerCase();
  if (
    type.includes("cash") ||
    type === "currency" ||
    type.includes("money market")
  ) {
    return "Cash";
  }
  if (type.includes("cryptocurrency") || type.includes("crypto")) {
    return "Crypto";
  }
  if (type.includes("etf") || type === "etf" || type.includes("exchange traded")) {
    return "ETF";
  }
  if (
    type.includes("equity") ||
    type.includes("stock") ||
    type === "adr" ||
    type.includes("mutual fund") ||
    type.includes("fixed income") ||
    type.includes("bond")
  ) {
    // Treat funds/bonds without clear ETF flag as Stock for portfolio tabs.
    if (type.includes("etf")) return "ETF";
    return "Stock";
  }

  // Fallback by ticker presence
  if (ticker && ticker.trim()) return "Stock";
  return null;
}

function mapHoldingsPayload(data: Awaited<ReturnType<typeof fetchPlaidInvestmentsHoldings>>): {
  holdings: MappedHolding[];
  skipped: number;
} {
  const securitiesById = new Map(
    data.securities.map((security) => [security.security_id, security])
  );
  const holdings: MappedHolding[] = [];
  let skipped = 0;

  for (const holding of data.holdings) {
    const security = securitiesById.get(holding.security_id);
    if (!security) {
      skipped += 1;
      continue;
    }

    const quantity = Number(holding.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity === 0) {
      skipped += 1;
      continue;
    }

    const ticker =
      security.ticker_symbol?.trim().toUpperCase() ||
      security.cusip?.trim().toUpperCase() ||
      null;

    const mappedType = mapSecurityType(
      security.type,
      ticker,
      security.is_cash_equivalent
    );

    if (!mappedType) {
      skipped += 1;
      console.info(
        "[broker-sync] skipping holding without mappable type",
        security.security_id,
        security.name,
        security.type
      );
      continue;
    }

    const institutionPrice = Number(holding.institution_price ?? 0);
    const closePrice = Number(security.close_price ?? 0);
    const currentPrice =
      institutionPrice > 0 ? institutionPrice : closePrice > 0 ? closePrice : 1;

    const costBasis = Number(holding.cost_basis ?? 0);
    const avgCost =
      mappedType === "Cash"
        ? 1
        : quantity !== 0 && Number.isFinite(costBasis) && costBasis > 0
          ? costBasis / Math.abs(quantity)
          : currentPrice;

    const symbol =
      mappedType === "Cash"
        ? `CASH-${(holding.account_id ?? "acct").slice(-6).toUpperCase()}`
        : ticker ?? `UNK-${security.security_id.slice(0, 8).toUpperCase()}`;

    const name =
      mappedType === "Cash"
        ? security.name?.trim() || "Cash"
        : security.name?.trim() || symbol;

    holdings.push({
      externalId: `${holding.account_id}:${holding.security_id}`,
      name,
      symbol,
      type: mappedType,
      quantity: Math.abs(quantity),
      avgCost: mappedType === "Cash" ? 1 : Math.max(0, avgCost),
      currentPrice: mappedType === "Cash" ? 1 : Math.max(0, currentPrice),
    });
  }

  // Also surface settlement cash from investment account balances when no cash holding exists.
  for (const account of data.accounts) {
    if (account.type !== "investment" && account.type !== "brokerage") continue;
    const current = Number(account.balances.current ?? 0);
    // Prefer holdings for positions; only add residual cash if balance looks like pure cash
    // and subtype suggests cash/settlement. Many brokers put equity MTM in current — skip those.
    const subtype = (account.subtype ?? "").toLowerCase();
    if (!subtype.includes("cash") && subtype !== "money market") continue;
    if (!Number.isFinite(current) || current <= 0) continue;

    holdings.push({
      externalId: `acct-cash:${account.account_id}`,
      name: account.name || account.official_name || "Account Cash",
      symbol: `CASH-${account.account_id.slice(-6).toUpperCase()}`,
      type: "Cash",
      quantity: current,
      avgCost: 1,
      currentPrice: 1,
    });
  }

  return { holdings, skipped };
}

export type SyncResult = {
  connectionId: string;
  importedCount: number;
  skippedCount: number;
  institutionName: string | null;
};

export async function syncBrokerConnection(
  connectionId: string,
  userId: string
): Promise<SyncResult> {
  const connection = await prisma.brokerConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) {
    throw new Error("Broker connection not found.");
  }

  const accessToken = decryptBrokerToken(connection.accessTokenEnc);
  let institutionName = connection.institutionName;
  let institutionId = connection.institutionId;

  try {
    const item = await fetchPlaidItem(accessToken);
    if (item.institution_id) {
      institutionId = item.institution_id;
      try {
        const institution = await fetchPlaidInstitution(item.institution_id);
        institutionName = institution.name;
      } catch {
        // Institution lookup is best-effort.
      }
    }

    const holdingsData = await fetchPlaidInvestmentsHoldings(accessToken);
    const { holdings, skipped } = mapHoldingsPayload(holdingsData);
    const incomingIds = new Set(holdings.map((item) => item.externalId));

    const existingBefore = await prisma.asset.findMany({
      where: {
        userId,
        connectionId: connection.id,
        source: "SYNCED",
      },
      select: { externalId: true, symbol: true, type: true },
    });
    const existingExternalIds = new Set(
      existingBefore
        .map((row) => row.externalId)
        .filter((id): id is string => Boolean(id))
    );
    const removedSymbols = existingBefore
      .filter((row) => row.externalId && !incomingIds.has(row.externalId))
      .map((row) => row.symbol);

    await prisma.$transaction(async (tx) => {
      for (const holding of holdings) {
        await tx.asset.upsert({
          where: {
            userId_externalId: {
              userId,
              externalId: holding.externalId,
            },
          },
          create: {
            userId,
            connectionId: connection.id,
            source: "SYNCED",
            externalId: holding.externalId,
            name: holding.name,
            symbol: holding.symbol,
            type: holding.type,
            quantity: holding.quantity,
            avgCost: holding.avgCost,
            currentPrice: holding.currentPrice,
          },
          update: {
            connectionId: connection.id,
            source: "SYNCED",
            name: holding.name,
            symbol: holding.symbol,
            type: holding.type,
            quantity: holding.quantity,
            avgCost: holding.avgCost,
            currentPrice: holding.currentPrice,
          },
        });
      }

      // Remove synced assets for this connection that disappeared from Plaid.
      const existing = await tx.asset.findMany({
        where: {
          userId,
          connectionId: connection.id,
          source: "SYNCED",
          externalId: { not: null },
        },
        select: { id: true, externalId: true },
      });

      const toDelete = existing
        .filter((row) => row.externalId && !incomingIds.has(row.externalId))
        .map((row) => row.id);

      if (toDelete.length > 0) {
        await tx.asset.deleteMany({
          where: { id: { in: toDelete }, userId },
        });
      }

      await tx.brokerConnection.update({
        where: { id: connection.id },
        data: {
          status: "ACTIVE",
          lastSyncedAt: new Date(),
          lastError: null,
          institutionId,
          institutionName,
        },
      });
    });

    for (const holding of holdings) {
      if (holding.type === "Cash") continue;
      if (!existingExternalIds.has(holding.externalId)) {
        scheduleEnsureSymbolHistory(holding.symbol, holding.type);
      }
    }
    if (removedSymbols.length > 0) {
      void maybePurgeSymbolsMarketData(removedSymbols).catch((error) => {
        console.error("[market] purge after broker sync failed", error);
      });
    }

    return {
      connectionId: connection.id,
      importedCount: holdings.length,
      skippedCount: skipped,
      institutionName,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    await prisma.brokerConnection.update({
      where: { id: connection.id },
      data: { status: "ERROR", lastError: message },
    });
    throw err;
  }
}
