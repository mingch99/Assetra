import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearOtherSessions, getCurrentUser } from "@/lib/auth-session";

type ChangePasswordPayload = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: ChangePasswordPayload;
  try {
    body = (await request.json()) as ChangePasswordPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword) {
    return NextResponse.json({ error: "請輸入目前密碼。" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "新密碼至少需要 6 個字元。" },
      { status: 400 }
    );
  }

  const isCurrentValid = await compare(
    currentPassword,
    currentUser.passwordHash
  );
  if (!isCurrentValid) {
    return NextResponse.json({ error: "目前密碼錯誤。" }, { status: 401 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "新密碼不可與目前密碼相同。" },
      { status: 400 }
    );
  }

  const passwordHash = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: currentUser.id },
    data: { passwordHash },
  });

  // 改密碼後強制其他裝置登出（保留目前這個 session）。
  await clearOtherSessions(currentUser.id);

  return NextResponse.json({
    data: { message: "密碼已更新，其他裝置已登出。" },
  });
}
