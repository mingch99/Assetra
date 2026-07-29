import { NextResponse } from "next/server";
import {
  deleteAsset,
  getAssetById,
  parseAssetPayload,
  updateAsset,
} from "@/lib/assets-store";
import { getCurrentUser } from "@/lib/auth-session";
import { trackUserActivity } from "@/lib/activity";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const asset = await getAssetById(id, user.id);

  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  return NextResponse.json({ data: asset });
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getAssetById(id, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
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
    const updated = await updateAsset(id, parsed.data, user.id);
    if (!updated) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }
    await trackUserActivity(user.id, "ASSET_UPDATE");
    return NextResponse.json({ data: updated });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update asset.";
    const status = message.includes("Synced") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteAsset(id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }
    await trackUserActivity(user.id, "ASSET_DELETE");
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete asset.";
    const status = message.includes("Synced") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
