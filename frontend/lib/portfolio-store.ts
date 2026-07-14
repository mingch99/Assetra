import { prisma } from "@/lib/prisma";

export type PortfolioState = {
  cashAmount: number;
  debtAmount: number;
  realEstateAmount: number;
};

type ParseResult =
  | { ok: true; data: PortfolioState }
  | { ok: false; message: string };

function toNonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

export async function getPortfolioState(userId: string): Promise<PortfolioState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      cashAmount: true,
      debtAmount: true,
      realEstateAmount: true,
    },
  });

  return {
    cashAmount: user?.cashAmount ?? 0,
    debtAmount: user?.debtAmount ?? 0,
    realEstateAmount: user?.realEstateAmount ?? 0,
  };
}

export async function updatePortfolioState(
  userId: string,
  input: PortfolioState
): Promise<PortfolioState> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      cashAmount: input.cashAmount,
      debtAmount: input.debtAmount,
      realEstateAmount: input.realEstateAmount,
    },
  });
  return getPortfolioState(userId);
}

export function parsePortfolioPayload(payload: unknown): ParseResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Invalid request body." };
  }

  const candidate = payload as Record<string, unknown>;
  const cashAmount = toNonNegativeNumber(candidate.cashAmount);
  const debtAmount = toNonNegativeNumber(candidate.debtAmount);
  const realEstateAmount = toNonNegativeNumber(candidate.realEstateAmount);

  if (cashAmount === null) {
    return { ok: false, message: "cashAmount must be a number >= 0." };
  }
  if (debtAmount === null) {
    return { ok: false, message: "debtAmount must be a number >= 0." };
  }
  if (realEstateAmount === null) {
    return { ok: false, message: "realEstateAmount must be a number >= 0." };
  }

  return { ok: true, data: { cashAmount, debtAmount, realEstateAmount } };
}
