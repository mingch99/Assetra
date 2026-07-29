import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { listAssets } from "@/lib/assets-store";
import { computePortfolioRisk } from "@/lib/market/portfolio-risk";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const assets = await listAssets(user.id);
    const data = await computePortfolioRisk(assets);
    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load portfolio risk.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
