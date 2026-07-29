import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import {
  createPlaidLinkToken,
  isPlaidConfigured,
} from "@/lib/broker/plaid-client";

export const runtime = "nodejs";

export async function POST() {
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

  try {
    const linkToken = await createPlaidLinkToken(user.id);
    return NextResponse.json({ data: { linkToken } });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create Plaid link token.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
