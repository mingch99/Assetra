"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { login, register } from "@/lib/api/auth";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAuthSubmit(e: FormSubmitEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("請輸入信箱與密碼。");
      return;
    }

    const payload = {
      email: email.trim(),
      password: password.trim(),
    };

    try {
      setIsSubmitting(true);
      if (mode === "register") {
        await register(payload);
      } else {
        await login(payload);
      }
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "登入或註冊失敗，請稍後再試。";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-black/30">
        <h1 className="text-3xl font-bold text-center mb-2">Assetra</h1>
        <p className="text-center text-[var(--muted)] mb-6">
          {mode === "login" ? "歡迎回來，請先登入" : "建立新帳號開始使用"}
        </p>

        <div className="mb-6 grid grid-cols-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1">
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "login"
              ? "bg-[var(--accent)] text-black"
              : "bg-transparent text-[var(--muted)]"
              }`}
            onClick={() => setMode("login")}
          >
            用戶登入
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "register"
              ? "bg-[var(--accent)] text-black"
              : "bg-transparent text-[var(--muted)]"
              }`}
            onClick={() => setMode("register")}
          >
            新用戶註冊
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleAuthSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
              信箱
            </label>
            <input
              type="text"
              placeholder="請輸入帳號"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
              密碼
            </label>
            <input
              type="password"
              placeholder={mode === "register" ? "請設定密碼（至少 6 碼）" : "請輸入密碼"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === "login" && (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-[var(--muted)] hover:text-[var(--accent)]"
              >
                忘記密碼？
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
          >
            {isSubmitting
              ? "處理中..."
              : mode === "login"
                ? "登入"
                : "註冊並登入"}
          </button>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </main>
  );
}