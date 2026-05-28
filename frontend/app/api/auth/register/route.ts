import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth-session";
import { trackUserActivity } from "@/lib/activity";

type RegisterPayload = {
  username?: unknown;
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: RegisterPayload;
  try {
    body = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !email || !password) {
    return NextResponse.json(
      { error: "username, email, password are required." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "username or email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
    },
  });

  await createSession(user.id);
  await trackUserActivity(user.id, "REGISTER");

  return NextResponse.json({
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
}
