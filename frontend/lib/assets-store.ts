import { prisma } from "@/lib/prisma";
import type { AssetType, NewAsset } from "@/types/asset";
import {
  maybePurgeSymbolMarketData,
  scheduleEnsureSymbolHistory,
} from "@/lib/market/symbol-lifecycle";

type AssetUpdateInput = {
  name: string;
  symbol: string;
  type: AssetType;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  groupId?: string | null;
};

function isManualCreatableType(value: unknown): value is AssetType {
  return value === "Stock" || value === "ETF" || value === "Crypto";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseGroupId(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return undefined;
}

function validateAssetPayload(payload: unknown): {
  ok: boolean;
  message?: string;
  data?: NewAsset;
} {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Invalid request body." };
  }

  const candidate = payload as Record<string, unknown>;
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const symbol =
    typeof candidate.symbol === "string"
      ? candidate.symbol.trim().toUpperCase()
      : "";
  const type = candidate.type;
  const quantity = candidate.quantity;
  const avgCost = candidate.avgCost;
  const currentPrice = candidate.currentPrice;
  const groupId = parseGroupId(candidate.groupId);

  if (!name) return { ok: false, message: "name is required." };
  if (!symbol) return { ok: false, message: "symbol is required." };
  if (!isManualCreatableType(type)) {
    return { ok: false, message: "type must be Stock, ETF, or Crypto." };
  }
  if (!isFiniteNumber(quantity) || quantity <= 0) {
    return { ok: false, message: "quantity must be a number greater than 0." };
  }
  if (!isFiniteNumber(avgCost) || avgCost < 0) {
    return { ok: false, message: "avgCost must be a number >= 0." };
  }
  if (!isFiniteNumber(currentPrice) || currentPrice < 0) {
    return { ok: false, message: "currentPrice must be a number >= 0." };
  }
  if (candidate.groupId !== undefined && groupId === undefined) {
    return { ok: false, message: "groupId must be a string or null." };
  }

  return {
    ok: true,
    data: {
      name,
      symbol,
      type,
      quantity,
      avgCost,
      currentPrice,
      groupId: groupId ?? null,
    },
  };
}

const assetInclude = {
  group: { select: { id: true, name: true } },
} as const;

export async function listAssets(userId: string) {
  return prisma.asset.findMany({
    where: { userId },
    include: assetInclude,
    orderBy: { createdAt: "asc" },
  });
}

export function getAssetById(id: string, userId: string) {
  return prisma.asset.findFirst({
    where: { id, userId },
    include: assetInclude,
  });
}

async function assertOwnedGroup(
  userId: string,
  groupId: string | null | undefined
) {
  if (!groupId) return;
  const group = await prisma.assetGroup.findFirst({
    where: { id: groupId, userId },
  });
  if (!group) {
    throw new Error("Group not found.");
  }
}

export async function createAsset(input: NewAsset, userId: string) {
  await assertOwnedGroup(userId, input.groupId);

  const created = await prisma.asset.create({
    data: {
      name: input.name,
      symbol: input.symbol,
      type: input.type,
      quantity: input.quantity,
      avgCost: input.avgCost,
      currentPrice: input.currentPrice,
      groupId: input.groupId ?? null,
      userId,
      source: input.source ?? "MANUAL",
      externalId: input.externalId ?? null,
      connectionId: input.connectionId ?? null,
    },
    include: assetInclude,
  });

  scheduleEnsureSymbolHistory(created.symbol, created.type);
  return created;
}

export async function updateAsset(
  id: string,
  input: AssetUpdateInput,
  userId: string
) {
  const existing = await getAssetById(id, userId);
  if (!existing) return null;

  if (existing.source === "SYNCED") {
    throw new Error("Synced assets cannot be edited manually.");
  }

  const nextGroupId =
    input.groupId === undefined ? existing.groupId : input.groupId;
  await assertOwnedGroup(userId, nextGroupId);

  return prisma.asset.update({
    where: { id },
    data: {
      name: input.name,
      symbol: input.symbol,
      type: input.type,
      quantity: input.quantity,
      avgCost: input.avgCost,
      currentPrice: input.currentPrice,
      ...(input.groupId !== undefined ? { groupId: input.groupId } : {}),
    },
    include: assetInclude,
  });
}

export async function deleteAsset(id: string, userId: string) {
  const existing = await getAssetById(id, userId);
  if (!existing) return false;
  if (existing.source === "SYNCED") {
    throw new Error(
      "Synced assets cannot be deleted individually. Disconnect the broker account instead."
    );
  }

  const result = await prisma.asset.deleteMany({
    where: { id, userId, source: "MANUAL" },
  });
  if (result.count > 0) {
    await maybePurgeSymbolMarketData(existing.symbol);
  }
  return result.count > 0;
}

export function parseAssetPayload(payload: unknown) {
  return validateAssetPayload(payload);
}
