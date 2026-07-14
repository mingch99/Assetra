"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/types";

type LanguageSwitcherProps = {
  className?: string;
};

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  function select(next: Locale) {
    setLocale(next);
  }

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1 text-sm ${className}`}
      role="group"
      aria-label={t("language")}
    >
      <button
        type="button"
        onClick={() => select("en")}
        className={`rounded-md px-2.5 py-1 font-semibold transition ${
          locale === "en"
            ? "bg-[var(--accent)] text-black"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
      >
        {t("langEn")}
      </button>
      <button
        type="button"
        onClick={() => select("zh")}
        className={`rounded-md px-2.5 py-1 font-semibold transition ${
          locale === "zh"
            ? "bg-[var(--accent)] text-black"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
      >
        {t("langZh")}
      </button>
    </div>
  );
}
