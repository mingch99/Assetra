import type { AgentMessage } from "@/ai-agent/types";
import type { Locale } from "@/lib/i18n/types";

export type ParsedAgentChatBody = {
  messages: AgentMessage[];
  locale: Locale;
};

export function parseAgentChatBody(body: unknown): ParsedAgentChatBody | null {
  if (!body || typeof body !== "object") return null;

  const candidate = body as Record<string, unknown>;
  if (!Array.isArray(candidate.messages)) return null;

  const messages: AgentMessage[] = [];
  for (const item of candidate.messages) {
    if (!item || typeof item !== "object") return null;
    const message = item as Record<string, unknown>;
    if (message.role !== "user" && message.role !== "assistant") return null;
    if (typeof message.content !== "string" || !message.content.trim()) {
      return null;
    }
    messages.push({
      role: message.role,
      content: message.content.trim(),
    });
  }

  if (messages.length === 0) return null;
  if (messages[messages.length - 1]?.role !== "user") return null;

  const locale: Locale = candidate.locale === "zh" ? "zh" : "en";

  return {
    messages: messages.slice(-20),
    locale,
  };
}

/** @deprecated Prefer parseAgentChatBody */
export function parseAgentMessages(body: unknown): AgentMessage[] | null {
  return parseAgentChatBody(body)?.messages ?? null;
}
