import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { isPlaidConfigured, removePlaidItem } from "@/lib/broker/plaid-client";
import { decryptBrokerToken } from "@/lib/broker/token-crypto";
import { maybePurgeSymbolsMarketData } from "@/lib/market/symbol-lifecycle";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const connection = await prisma.brokerConnection.findFirst({
    where: { id, userId: user.id },
  });

  if (!connection) {
    return NextResponse.json({ error: "Connection not found." }, { status: 404 });
  }

  if (isPlaidConfigured()) {
    try {
      const accessToken = decryptBrokerToken(connection.accessTokenEnc);
      await removePlaidItem(accessToken);
    } catch {
      // Continue local cleanup even if Plaid revoke fails.
    }
  }

  const syncedAssets = await prisma.asset.findMany({
    where: {
      userId: user.id,
      connectionId: connection.id,
      source: "SYNCED",
    },
    select: { symbol: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.asset.deleteMany({
      where: {
        userId: user.id,
        connectionId: connection.id,
        source: "SYNCED",
      },
    });
    await tx.brokerConnection.delete({
      where: { id: connection.id },
    });
  });

  await maybePurgeSymbolsMarketData(syncedAssets.map((asset) => asset.symbol));

  return NextResponse.json({ data: { ok: true } });
}
