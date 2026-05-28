import { prisma } from "@/lib/prisma";
import type { Asset, AssetType, NewAsset } from "@/types/asset";

type AssetUpdateInput = Omit<Asset, "id">;

function isAssetType(value: unknown): value is AssetType {
  return value === "Stock" || value === "Crypto";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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
    typeof candidate.symbol === "string" ? candidate.symbol.trim().toUpperCase() : "";
  const type = candidate.type;
  const quantity = candidate.quantity;
  const avgCost = candidate.avgCost;
  const currentPrice = candidate.currentPrice;

  if (!name) return { ok: false, message: "name is required." };
  if (!symbol) return { ok: false, message: "symbol is required." };
  if (!isAssetType(type)) return { ok: false, message: "type must be Stock or Crypto." };
  if (!isFiniteNumber(quantity) || quantity <= 0) {
    return { ok: false, message: "quantity must be a number greater than 0." };
  }
  if (!isFiniteNumber(avgCost) || avgCost < 0) {
    return { ok: false, message: "avgCost must be a number >= 0." };
  }
  if (!isFiniteNumber(currentPrice) || currentPrice < 0) {
    return { ok: false, message: "currentPrice must be a number >= 0." };
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
    },
  };
}

export async function listAssets(userId: string) {
  return prisma.asset.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export function getAssetById(id: string, userId: string) {
  return prisma.asset.findFirst({
    where: { id, userId },
  });
}

export async function createAsset(input: NewAsset, userId: string) {
  const existing = await prisma.asset.findFirst({
    where: {
      userId,
      symbol: input.symbol,
    },
  });

  if (existing) {
    throw new Error("Asset symbol already exists for this user.");
  }

  return prisma.asset.create({
    data: {
      ...input,
      userId,
    },
  });
}

export function updateAsset(id: string, input: AssetUpdateInput, userId: string) {
  return prisma.asset.updateMany({
    where: { id, userId },
    data: input,
  }).then(async (result) => {
    if (result.count === 0) return null;
    return prisma.asset.findUnique({ where: { id } });
  });
}

export async function deleteAsset(id: string, userId: string) {
  const result = await prisma.asset.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
}

export function parseAssetPayload(payload: unknown) {
  return validateAssetPayload(payload);
}
