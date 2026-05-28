import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import {
  getPortfolioState,
  parsePortfolioPayload,
  updatePortfolioState,
} from "@/lib/portfolio-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const portfolio = await getPortfolioState(user.id);
  return NextResponse.json({ data: portfolio });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parsePortfolioPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }

  const updated = await updatePortfolioState(user.id, parsed.data);
  return NextResponse.json({ data: updated });
}
