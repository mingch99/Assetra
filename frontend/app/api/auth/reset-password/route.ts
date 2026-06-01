import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/password-reset";

type ResetPasswordPayload = {
  token?: unknown;
  password?: unknown;
};

const INVALID_TOKEN_MESSAGE = "連結已失效或過期，請重新申請密碼重設。";

export async function POST(request: Request) {
  let body: ResetPasswordPayload;
  try {
    body = (await request.json()) as ResetPasswordPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "密碼至少需要 6 個字元。" },
      { status: 400 }
    );
  }

  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  // token 不存在、已使用、或已過期都視為失效。
  if (
    !resetToken ||
    resetToken.usedAt !== null ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
  }

  const passwordHash = await hash(password, 10);

  await prisma.$transaction([
    // 更新密碼
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    // 標記此 token 已使用（單次使用）
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    // 作廢該使用者其他尚未使用的重設 token
    prisma.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
        id: { not: resetToken.id },
      },
      data: { usedAt: new Date() },
    }),
    // 清除所有登入 session（強制其他裝置重新登入）
    prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  return NextResponse.json({
    data: { message: "密碼已更新，請使用新密碼重新登入。" },
  });
}
