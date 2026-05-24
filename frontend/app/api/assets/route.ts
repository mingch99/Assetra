import { NextResponse } from "next/server";
import { createAsset, listAssets, parseAssetPayload } from "@/lib/assets-store";

export async function GET() {
  const assets = await listAssets();
  return NextResponse.json({ data: assets });
}

export async function POST(request: Request) {
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

  const created = await createAsset(parsed.data);
  return NextResponse.json({ data: created }, { status: 201 });
}
