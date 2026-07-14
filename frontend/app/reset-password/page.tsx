"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import { resetPassword } from "@/lib/api/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

function ResetPasswordForm() {
  const { t } = useI18n();
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
      setError(t("resetInvalidLink"));
      return;
    }

    if (password.length < 6) {
      setError(t("resetPasswordMin"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("resetPasswordMismatch"));
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await resetPassword({ token, password });
      setMessage(result.message || t("resetSuccess"));
      setIsDone(true);
      window.setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("resetFailed");
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {t("resetInvalidOrMissing")}
        </p>
        <Link
          href="/forgot-password"
          className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black transition hover:bg-[var(--accent-hover)]"
        >
          {t("resetRequestAgain")}
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
          className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black transition hover:bg-[var(--accent-hover)]"
        >
          {t("resetGoToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
          {t("resetNewPassword")}
        </label>
        <input
          type="password"
          placeholder={t("resetNewPasswordPlaceholder")}
          autoComplete="new-password"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
          {t("resetConfirmPassword")}
        </label>
        <input
          type="password"
          placeholder={t("resetConfirmPasswordPlaceholder")}
          autoComplete="new-password"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]/70"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-center font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {isSubmitting ? t("resetSubmitting") : t("resetSubmit")}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)]">
      <div className="absolute right-6 top-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-black/30">
        <h1 className="mb-2 text-center text-3xl font-bold">{t("resetTitle")}</h1>
        <p className="mb-6 text-center text-[var(--muted)]">
          {t("resetDescription")}
        </p>
        <Suspense
          fallback={
            <p className="text-center text-[var(--muted)]">{t("loading")}</p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
