import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import {
  createGroup,
  listGroups,
  parseGroupPayload,
} from "@/lib/groups-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const groups = await listGroups(user.id);
  return NextResponse.json({ data: groups });
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

  const parsed = parseGroupPayload(body);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }

  const group = await createGroup(parsed.data, user.id);
  return NextResponse.json({ data: group }, { status: 201 });
}
