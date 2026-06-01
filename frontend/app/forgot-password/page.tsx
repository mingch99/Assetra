"use client";

import { useState } from "react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { requestPasswordReset } from "@/lib/api/auth";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(e: FormSubmitEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("請輸入信箱。");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
      setIsDone(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "送出失敗，請稍後再試。";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-black/30">
        <h1 className="text-3xl font-bold text-center mb-2">忘記密碼</h1>
        <p className="text-center text-[var(--muted)] mb-6">
          輸入註冊信箱，我們會寄出密碼重設連結。
        </p>

        {isDone ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--foreground)]">
              {message}
            </p>
            <Link
              href="/"
              className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black hover:bg-[var(--accent-hover)] transition"
            >
              返回登入
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                信箱
              </label>
              <input
                type="email"
                placeholder="請輸入註冊信箱"
                autoComplete="email"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
            >
              {isSubmitting ? "送出中..." : "寄送重設連結"}
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Link
              href="/"
              className="block text-center text-sm text-[var(--muted)] hover:text-[var(--accent)]"
            >
              返回登入
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
