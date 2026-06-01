import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearSession, getCurrentUser } from "@/lib/auth-session";

type DeleteAccountPayload = {
  password?: unknown;
};

export async function DELETE(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: DeleteAccountPayload;
  try {
    body = (await request.json()) as DeleteAccountPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json(
      { error: "請輸入密碼以確認刪除。" },
      { status: 400 }
    );
  }

  const isPasswordValid = await compare(password, currentUser.passwordHash);
  if (!isPasswordValid) {
    return NextResponse.json({ error: "密碼錯誤。" }, { status: 401 });
  }

  // 刪除使用者；schema 中 Asset / Session / UserActivity / PasswordResetToken
  // 皆設定 onDelete: Cascade，會一併刪除所有相關資料。
  await prisma.user.delete({
    where: { id: currentUser.id },
  });

  // 清除瀏覽器的 session cookie（DB session 已隨帳號刪除）。
  await clearSession();

  return NextResponse.json({ data: { message: "帳號已刪除。" } });
}
