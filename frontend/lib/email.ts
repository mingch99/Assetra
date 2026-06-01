type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

/**
 * Sends the password reset email.
 *
 * 開發模式：不會真的寄信，而是把重設連結印在伺服器 console，方便測試整個流程。
 * 之後要接真正的寄信服務（Resend / SMTP 等）時，只要替換這個函式內部即可，
 * 呼叫端（forgot-password API）不需要更動。
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailInput): Promise<void> {
  console.log(
    [
      "",
      "==================== 密碼重設信件（開發模式） ====================",
      `收件者: ${to}`,
      `重設連結: ${resetUrl}`,
      "（此連結 60 分鐘內有效，且僅能使用一次）",
      "================================================================",
      "",
    ].join("\n")
  );
}
