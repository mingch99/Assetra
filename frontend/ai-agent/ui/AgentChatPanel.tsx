"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendAgentMessage } from "@/ai-agent/client/send-message";
import type { AgentMessage } from "@/ai-agent/types";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type AgentChatPanelProps = {
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function AgentChatPanel({
  disabled = false,
  autoFocus = false,
}: AgentChatPanelProps) {
  const { t, locale } = useI18n();
  const welcomeMessage = t("advisorWelcome");
  const suggestions = useMemo(
    () => [
      t("advisorSuggestion1"),
      t("advisorSuggestion2"),
      t("advisorSuggestion3"),
      t("advisorSuggestion4"),
    ],
    [t]
  );

  const [messages, setMessages] = useState<AgentMessage[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasUserMessagesRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  // Keep the welcome message in sync when the locale changes (before any chat).
  useEffect(() => {
    if (hasUserMessagesRef.current) return;
    setMessages([{ role: "assistant", content: welcomeMessage }]);
  }, [locale, welcomeMessage]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading || disabled) return;

      hasUserMessagesRef.current = true;
      const userMessage: AgentMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMessage];
      const assistantPlaceholder: AgentMessage = {
        role: "assistant",
        content: "",
      };

      setMessages([...nextMessages, assistantPlaceholder]);
      setInput("");
      setError("");
      setIsLoading(true);

      try {
        await sendAgentMessage(
          nextMessages,
          (chunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              const last = updated[lastIndex];
              if (!last || last.role !== "assistant") return prev;
              updated[lastIndex] = {
                ...last,
                content: last.content + chunk,
              };
              return updated;
            });
          },
          { locale }
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("advisorFailed");
        setError(message);
        setMessages((prev) => {
          const withoutEmptyAssistant = prev.filter(
            (item, index) =>
              !(
                index === prev.length - 1 &&
                item.role === "assistant" &&
                !item.content
              )
          );
          return withoutEmptyAssistant;
        });
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [disabled, isLoading, locale, messages, t]
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                message.role === "user"
                  ? "bg-[var(--accent)] text-[#1a1a1a]"
                  : "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)]"
              }`}
            >
              {message.content ||
                (isLoading && index === messages.length - 1
                  ? t("advisorThinking")
                  : "")}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-5 mb-3 rounded-lg border border-red-400/30 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="border-t border-[var(--border)] px-5 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={isLoading || disabled}
              onClick={() => void sendMessage(suggestion)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
            placeholder={t("advisorInputPlaceholder")}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || disabled || !input.trim()}
            className="self-end rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#1a1a1a] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {isLoading ? "..." : t("advisorSend")}
          </button>
        </form>

        <p className="mt-3 text-xs text-[var(--muted)] opacity-50">
          本功能僅供參考，不構成投資建議。投資有風險，請自行評估。
        </p>
      </div>
    </div>
  );
}
