import { prisma } from "@/lib/prisma";
import type { Asset, AssetType, NewAsset } from "@/types/asset";

type AssetUpdateInput = Omit<Asset, "id">;

const defaultAssets: NewAsset[] = [
  {
    name: "Apple",
    symbol: "AAPL",
    type: "Stock",
    quantity: 10,
    avgCost: 180,
    currentPrice: 195,
  },
  {
    name: "Bitcoin",
    symbol: "BTC",
    type: "Crypto",
    quantity: 0.2,
    avgCost: 60000,
    currentPrice: 67000,
  },
  {
    name: "Tesla",
    symbol: "TSLA",
    type: "Stock",
    quantity: 5,
    avgCost: 220,
    currentPrice: 210,
  },
];

let hasSeededDefaults = false;

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

async function seedDefaultsIfEmpty() {
  if (hasSeededDefaults) return;

  const count = await prisma.asset.count();
  if (count > 0) {
    hasSeededDefaults = true;
    return;
  }

  await prisma.asset.createMany({
    data: defaultAssets,
  });
  hasSeededDefaults = true;
}

export async function listAssets() {
  await seedDefaultsIfEmpty();
  return prisma.asset.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
  });
}

export function createAsset(input: NewAsset) {
  return prisma.asset.create({
    data: input,
  });
}

export function updateAsset(id: string, input: AssetUpdateInput) {
  return prisma.asset.update({
    where: { id },
    data: input,
  });
}

export async function deleteAsset(id: string) {
  try {
    await prisma.asset.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export function parseAssetPayload(payload: unknown) {
  return validateAssetPayload(payload);
}
