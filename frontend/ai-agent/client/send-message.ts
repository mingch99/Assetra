import { AI_AGENT_API_PATH } from "@/ai-agent/constants";
import type { AgentMessage } from "@/ai-agent/types";
import type { Locale } from "@/lib/i18n/types";

type ApiError = {
  error?: string;
};

export async function sendAgentMessage(
  messages: AgentMessage[],
  onChunk: (text: string) => void,
  options?: {
    apiPath?: string;
    locale?: Locale;
  }
): Promise<void> {
  const apiPath = options?.apiPath ?? AI_AGENT_API_PATH;
  const locale = options?.locale ?? "en";

  const response = await fetch(apiPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, locale }),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiError;
      if (errorBody.error) message = errorBody.error;
    } catch {
      // Use fallback message.
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Empty AI Agent response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) onChunk(chunk);
  }
}
