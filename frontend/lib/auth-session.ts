import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "assetra_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // Session 的有效期限 = 1000ms (1s) * 60s (1m) * 60m (1h) * 24h (1d) * 7d (7days) = 7 days

// 建立新的登入 Session (建立新的房卡)
export async function createSession(userId: string) {
  // Step 1: 生成唯一的 Session Token (房卡)
  const token = crypto.randomUUID();
  // Step 2: 設定 Session 的過期時間 (目前時間 + Session 的有效期限(7天))
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  // Step 3: 將 Token、使用者 ID 與過期時間儲存到 Session Table
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  // Step 4: 將 Session Token (房卡) 儲存到瀏覽器的 Cookie
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,     // 設定 Cookie 的名稱
    token,              // 設定 Cookie 的值 (Session Token)
    // 網路安全設定
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    }
  );
}



// 取得目前登入的使用者
export async function getCurrentUser() {
  const cookieStore = await cookies(); // Step 1: 取得瀏覽器送來的 Cookie
  const token = cookieStore.get(SESSION_COOKIE)?.value; // Step 2: 從 Cookie 中取出 Session Token (房卡)，Server (櫃檯) 會利用這個 Token 找到目前登入的使用者 (User)
  if (!token) return null;

  // Step 3: 利用 Session Token 查詢 Session Table，取得 Session 資料 (user)
  const session = await prisma.session.findUnique({
    where: { token },           // 根據 Session Token 找到對應的 Session 資料
    include: { user: true },    // 根據 Session.userId，自動查詢並一併回傳關聯的 User 資料
  });
  if (!session) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  // Step 4: 檢查 Session 是否過期，如果過期則刪除 Session 並清除 Cookie
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({
      where: { id: session.id },
    });
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session.user;
}



// 登出目前裝置
export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}



// 登出目前使用者的其他裝置，只保留目前裝置
export async function clearOtherSessions(userId: string) {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value;

  // 沒有目前 Token 時，無法判斷哪一個 Session 應該被保留
  if (!currentToken) return;

  await prisma.session.deleteMany({
    where: {
      userId,
      token: {
        not: currentToken,
      },
    },
  });
}