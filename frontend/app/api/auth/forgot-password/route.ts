import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  RESET_REQUEST_THROTTLE_MS,
  RESET_TOKEN_TTL_MS,
  generateResetToken,
} from "@/lib/password-reset";

type ForgotPasswordPayload = {
  email?: unknown;
};

// 不論信箱是否存在都回一致訊息，避免信箱列舉攻擊。
const GENERIC_MESSAGE =
  "若此信箱已註冊，我們已寄出密碼重設連結，請至信箱查看。";

function resolveOrigin(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  let body: ForgotPasswordPayload;
  try {
    body = (await request.json()) as ForgotPasswordPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "請輸入信箱。" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // 信箱不存在時，仍回一致成功訊息（不洩漏帳號是否存在）。
  if (!user) {
    return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
  }

  // 基本節流：若短時間內已申請過且尚未使用，就不再寄新信。
  const recentToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      createdAt: { gt: new Date(Date.now() - RESET_REQUEST_THROTTLE_MS) },
    },
  });

  if (recentToken) {
    return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
  }

  const { rawToken, tokenHash } = generateResetToken();

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${resolveOrigin(request)}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail({ to: email, resetUrl });

  return NextResponse.json({ data: { message: GENERIC_MESSAGE } });
}
