"use client";

import { useState } from "react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { requestPasswordReset } from "@/lib/api/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export default function ForgotPasswordPage() {
  const { t } = useI18n();
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
      setError(t("forgotEmailRequired"));
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
      setIsDone(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("forgotSubmitFailed");
      setError(msg);
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
        <h1 className="mb-2 text-center text-3xl font-bold">{t("forgotTitle")}</h1>
        <p className="mb-6 text-center text-[var(--muted)]">
          {t("forgotDescription")}
        </p>

        {isDone ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--foreground)]">
              {message}
            </p>
            <Link
              href="/"
              className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black transition hover:bg-[var(--accent-hover)]"
            >
              {t("forgotBackToLogin")}
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                {t("authEmail")}
              </label>
              <input
                type="email"
                placeholder={t("authEmailPlaceholder")}
                autoComplete="email"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {isSubmitting ? t("forgotSubmitting") : t("forgotSubmit")}
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Link
              href="/"
              className="block text-center text-sm text-[var(--muted)] hover:text-[var(--accent)]"
            >
              {t("forgotBackToLogin")}
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
