"use client";

import { useCallback, useEffect, useState } from "react";
import AgentChatPanel from "@/ai-agent/ui/AgentChatPanel";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type AgentChatWidgetProps = {
  disabled?: boolean;
};

export default function AgentChatWidget({ disabled = false }: AgentChatWidgetProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    window.setTimeout(() => setIsOpen(false), 300);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={t("openAdvisor")}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-xl text-[#1a1a1a] shadow-lg transition hover:bg-[var(--accent-hover)] hover:scale-105 active:scale-95"
      >
        ✦
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label={t("closeAdvisor")}
            onClick={close}
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={t("advisorTitle")}
            className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-transform duration-300 ease-out ${
              isVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15 text-lg">
                  ✦
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--accent)]">
                    {t("advisorTitle")}
                  </h2>
                  <p className="text-xs text-[var(--muted)] opacity-70">
                    {t("advisorSubtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t("close")}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              >
                {t("close")}
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <AgentChatPanel disabled={disabled} autoFocus={isVisible} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
