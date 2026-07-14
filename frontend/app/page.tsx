"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { login, register } from "@/lib/api/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAuthSubmit(e: FormSubmitEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError(t("authEmailPasswordRequired"));
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
        err instanceof Error ? err.message : t("authFailed");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)]">
      <div className="absolute right-6 top-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-black/30">
        <h1 className="mb-2 text-center text-3xl font-bold">Assetra</h1>
        <p className="mb-6 text-center text-[var(--muted)]">
          {mode === "login" ? t("authWelcomeBack") : t("authCreateAccount")}
        </p>

        <div className="mb-6 grid grid-cols-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1">
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-[var(--accent)] text-black"
                : "bg-transparent text-[var(--muted)]"
            }`}
            onClick={() => setMode("login")}
          >
            {t("authLoginTab")}
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === "register"
                ? "bg-[var(--accent)] text-black"
                : "bg-transparent text-[var(--muted)]"
            }`}
            onClick={() => setMode("register")}
          >
            {t("authRegisterTab")}
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleAuthSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
              {t("authEmail")}
            </label>
            <input
              type="text"
              placeholder={t("authEmailPlaceholder")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
              {t("authPassword")}
            </label>
            <input
              type="password"
              placeholder={
                mode === "register"
                  ? t("authPasswordPlaceholderRegister")
                  : t("authPasswordPlaceholder")
              }
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
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
                {t("authForgotPassword")}
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {isSubmitting
              ? t("authSubmitting")
              : mode === "login"
                ? t("authLogin")
                : t("authRegister")}
          </button>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </main>
  );
}
