import { createHash, randomBytes } from "crypto";

// 重設 token 有效時間：60 分鐘
export const RESET_TOKEN_TTL_MS = 1000 * 60 * 60;

// 同一使用者最短重新申請間隔（基本節流）：60 秒
export const RESET_REQUEST_THROTTLE_MS = 1000 * 60;

export function generateResetToken() {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashResetToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}
