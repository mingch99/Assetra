import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { listAssets } from "@/lib/assets-store";
import { getQuotesForAssets } from "@/lib/prices";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const assets = await listAssets(user.id);
  const quotes = await getQuotesForAssets(
    assets.map((asset) => ({ symbol: asset.symbol, type: asset.type }))
  );

  return NextResponse.json({ data: quotes });
}
