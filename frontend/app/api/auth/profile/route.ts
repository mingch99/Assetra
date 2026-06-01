import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";

type ProfilePayload = {
  username?: unknown;
};

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: ProfilePayload;
  try {
    body = (await request.json()) as ProfilePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawUsername =
    typeof body.username === "string" ? body.username.trim() : "";
  const username = rawUsername.length > 0 ? rawUsername : null;

  if (username) {
    if (username.length > 30) {
      return NextResponse.json(
        { error: "暱稱請勿超過 30 個字元。" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: currentUser.id },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "此暱稱已被使用，請換一個。" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: currentUser.id },
    data: { username },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      username: updated.username,
      email: updated.email,
    },
  });
}
