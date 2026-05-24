import { NextResponse } from "next/server";
import {
  deleteAsset,
  getAssetById,
  parseAssetPayload,
  updateAsset,
} from "@/lib/assets-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const asset = await getAssetById(id);

  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  return NextResponse.json({ data: asset });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await getAssetById(id);
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

  const updated = await updateAsset(id, parsed.data);
  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteAsset(id);

  if (!deleted) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
