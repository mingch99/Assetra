import { NextResponse } from "next/server";
import { createAsset, listAssets, parseAssetPayload } from "@/lib/assets-store";
import { getCurrentUser } from "@/lib/auth-session";
import { trackUserActivity } from "@/lib/activity";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const assets = await listAssets(user.id);
  await trackUserActivity(user.id, "DASHBOARD_VIEW");
  return NextResponse.json({ data: assets });
}

export async function POST(request: Request) {
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

  const parsed = parseAssetPayload(body);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json(
      { error: parsed.message ?? "Invalid payload." },
      { status: 400 }
    );
  }

  try {
    const created = await createAsset(parsed.data, user.id);
    await trackUserActivity(user.id, "ASSET_CREATE");
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create asset.";
    const status =
      message === "Asset symbol already exists for this user." ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
