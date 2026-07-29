import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import {
  exchangePlaidPublicToken,
  fetchPlaidInstitution,
  fetchPlaidItem,
  isPlaidConfigured,
} from "@/lib/broker/plaid-client";
import { encryptBrokerToken } from "@/lib/broker/token-crypto";
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
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const publicToken =
    body &&
    typeof body === "object" &&
    typeof (body as { publicToken?: unknown }).publicToken === "string"
      ? (body as { publicToken: string }).publicToken.trim()
      : "";

  if (!publicToken) {
    return NextResponse.json(
      { error: "publicToken is required." },
      { status: 400 }
    );
  }

  try {
    const { accessToken, itemId } = await exchangePlaidPublicToken(publicToken);

    let institutionId: string | null = null;
    let institutionName: string | null = null;
    try {
      const item = await fetchPlaidItem(accessToken);
      institutionId = item.institution_id ?? null;
      if (institutionId) {
        const institution = await fetchPlaidInstitution(institutionId);
        institutionName = institution.name;
      }
    } catch {
      // Best-effort metadata.
    }

    const connection = await prisma.brokerConnection.upsert({
      where: { itemId },
      create: {
        userId: user.id,
        itemId,
        accessTokenEnc: encryptBrokerToken(accessToken),
        institutionId,
        institutionName,
        status: "ACTIVE",
      },
      update: {
        userId: user.id,
        accessTokenEnc: encryptBrokerToken(accessToken),
        institutionId,
        institutionName,
        status: "ACTIVE",
        lastError: null,
      },
    });

    const syncResult = await syncBrokerConnection(connection.id, user.id);

    return NextResponse.json({
      data: {
        connectionId: connection.id,
        institutionName: syncResult.institutionName,
        importedCount: syncResult.importedCount,
        skippedCount: syncResult.skippedCount,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to link broker account.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
