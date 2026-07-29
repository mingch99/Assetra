import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncBrokerConnection } from "@/lib/broker/sync-holdings";

export const runtime = "nodejs";

/**
 * Plaid webhook receiver (optional for MVP).
 * Configure PLAID_WEBHOOK_URL to point here for auto-sync after market updates.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const payload = body as {
    webhook_type?: string;
    webhook_code?: string;
    item_id?: string;
  };

  const itemId = payload.item_id?.trim();
  if (!itemId) {
    return NextResponse.json({ ok: true });
  }

  const connection = await prisma.brokerConnection.findFirst({
    where: { itemId, status: { not: "DISCONNECTED" } },
  });

  if (!connection) {
    return NextResponse.json({ ok: true });
  }

  const type = payload.webhook_type ?? "";
  const code = payload.webhook_code ?? "";
  const shouldSync =
    type === "HOLDINGS" ||
    (type === "INVESTMENTS_TRANSACTIONS" && code === "DEFAULT_UPDATE") ||
    code === "DEFAULT_UPDATE" ||
    code === "HISTORICAL_UPDATE";

  if (shouldSync) {
    try {
      await syncBrokerConnection(connection.id, connection.userId);
    } catch (err) {
      console.error("[plaid-webhook] sync failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
