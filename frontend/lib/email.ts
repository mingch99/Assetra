import { Resend } from "resend";

type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

const DEFAULT_FROM = "Assetra <onboarding@resend.dev>";

function logDevResetLink(to: string, resetUrl: string) {
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

/**
 * Sends the password reset email via Resend.
 * Without RESEND_API_KEY, logs the reset link to the server console (local dev).
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logDevResetLink(to, resetUrl);
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "重設您的 Assetra 密碼",
    html: `
      <p>您好，</p>
      <p>我們收到您申請重設 Assetra 帳號密碼的請求。請點擊下方連結設定新密碼：</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>此連結 60 分鐘內有效，且僅能使用一次。若您未申請重設密碼，可忽略此信。</p>
      <p>— Assetra</p>
    `,
    text: [
      "您好，",
      "",
      "我們收到您申請重設 Assetra 帳號密碼的請求。請開啟以下連結設定新密碼：",
      resetUrl,
      "",
      "此連結 60 分鐘內有效，且僅能使用一次。若您未申請重設密碼，可忽略此信。",
      "",
      "— Assetra",
    ].join("\n"),
  });

  if (error) {
    console.error("Resend password reset email failed:", error);
    throw new Error(error.message);
  }
}
