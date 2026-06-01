import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth-session";
import { trackUserActivity } from "@/lib/activity";

type LoginPayload = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: LoginPayload;
  try {
    body = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "請輸入信箱與密碼。" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return NextResponse.json({ error: "信箱或密碼錯誤。" }, { status: 401 });
  }

  const isValidPassword = await compare(password, user.passwordHash);
  if (!isValidPassword) {
    return NextResponse.json({ error: "信箱或密碼錯誤。" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession(user.id);
  await trackUserActivity(user.id, "LOGIN");

  return NextResponse.json({
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
}
