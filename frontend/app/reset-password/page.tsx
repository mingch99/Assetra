"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import { resetPassword } from "@/lib/api/auth";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(e: FormSubmitEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("連結無效，請重新申請密碼重設。");
      return;
    }

    if (password.length < 6) {
      setError("密碼至少需要 6 個字元。");
      return;
    }

    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不一致。");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await resetPassword({ token, password });
      setMessage(result.message);
      setIsDone(true);
      window.setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "重設失敗，請稍後再試。";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          連結無效或缺少重設參數，請重新申請密碼重設。
        </p>
        <Link
          href="/forgot-password"
          className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black hover:bg-[var(--accent-hover)] transition"
        >
          重新申請
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--foreground)]">
          {message}
        </p>
        <Link
          href="/"
          className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black hover:bg-[var(--accent-hover)] transition"
        >
          前往登入
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
          新密碼
        </label>
        <input
          type="password"
          placeholder="請設定新密碼（至少 6 碼）"
          autoComplete="new-password"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
          確認新密碼
        </label>
        <input
          type="password"
          placeholder="請再次輸入新密碼"
          autoComplete="new-password"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
      >
        {isSubmitting ? "更新中..." : "更新密碼"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-black/30">
        <h1 className="text-3xl font-bold text-center mb-2">重設密碼</h1>
        <p className="text-center text-[var(--muted)] mb-6">
          設定一組新密碼，完成後請重新登入。
        </p>
        <Suspense
          fallback={<p className="text-center text-[var(--muted)]">載入中...</p>}
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
