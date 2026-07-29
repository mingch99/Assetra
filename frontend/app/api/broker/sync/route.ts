import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { isPlaidConfigured } from "@/lib/broker/plaid-client";
import { syncBrokerConnection } from "@/lib/broker/sync-holdings";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isPlaidConfigured()) {
    return NextResponse.json(
      {
        error:
          "Plaid 尚未設定。請在環境變數加入 PLAID_CLIENT_ID 與 PLAID_SECRET。",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const connectionId =
    body &&
    typeof body === "object" &&
    typeof (body as { connectionId?: unknown }).connectionId === "string"
      ? (body as { connectionId: string }).connectionId.trim()
      : "";

  try {
    if (connectionId) {
      const result = await syncBrokerConnection(connectionId, user.id);
      return NextResponse.json({ data: result });
    }

    const connections = await prisma.brokerConnection.findMany({
      where: { userId: user.id, status: { not: "DISCONNECTED" } },
      select: { id: true },
    });

    const results = [];
    for (const connection of connections) {
      results.push(await syncBrokerConnection(connection.id, user.id));
    }

    return NextResponse.json({ data: { results } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
