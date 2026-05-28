import { prisma } from "@/lib/prisma";

export type PortfolioState = {
  cashAmount: number;
  debtAmount: number;
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
  const rows = await prisma.$queryRaw<Array<{ cashAmount: number; debtAmount: number }>>`
    SELECT "cashAmount", "debtAmount"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;

  const row = rows[0];
  return {
    cashAmount: row?.cashAmount ?? 0,
    debtAmount: row?.debtAmount ?? 0,
  };
}

export async function updatePortfolioState(
  userId: string,
  input: PortfolioState
): Promise<PortfolioState> {
  await prisma.$executeRaw`
    UPDATE "User"
    SET "cashAmount" = ${input.cashAmount},
        "debtAmount" = ${input.debtAmount}
    WHERE "id" = ${userId}
  `;
  return getPortfolioState(userId);
}

export function parsePortfolioPayload(payload: unknown): ParseResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Invalid request body." };
  }

  const candidate = payload as Record<string, unknown>;
  const cashAmount = toNonNegativeNumber(candidate.cashAmount);
  const debtAmount = toNonNegativeNumber(candidate.debtAmount);

  if (cashAmount === null) {
    return { ok: false, message: "cashAmount must be a number >= 0." };
  }
  if (debtAmount === null) {
    return { ok: false, message: "debtAmount must be a number >= 0." };
  }

  return { ok: true, data: { cashAmount, debtAmount } };
}
