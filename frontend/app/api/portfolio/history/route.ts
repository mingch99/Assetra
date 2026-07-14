import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import {
  buildPortfolioHistory,
  isHistoryRange,
} from "@/lib/portfolio-history";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rangeParam =
    new URL(request.url).searchParams.get("range")?.trim().toLowerCase() ??
    "ytd";

  if (!isHistoryRange(rangeParam)) {
    return NextResponse.json(
      { error: "range must be one of 7d, 30d, 90d, ytd, 1y." },
      { status: 400 }
    );
  }

  try {
    const history = await buildPortfolioHistory(user.id, rangeParam);
    return NextResponse.json({ data: history });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
