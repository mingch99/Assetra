import type { AgentConfig } from "@/ai-agent/types";
import { buildSystemMessage } from "@/ai-agent/server/prompts";
import { parseAgentChatBody } from "@/ai-agent/server/parse-messages";
import { createOpenAIStreamResponse } from "@/ai-agent/server/openai-stream";

export async function handleAgentChat(
  body: unknown,
  portfolioContext: string,
  config: AgentConfig
): Promise<Response> {
  const parsed = parseAgentChatBody(body);
  if (!parsed) {
    return jsonError(
      "messages must be a non-empty array ending with a user message.",
      400
    );
  }

  const { messages, locale } = parsed;

  const openAiMessages = [
    {
      role: "system" as const,
      content: buildSystemMessage(portfolioContext, locale),
    },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  const openAiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: openAiMessages,
        stream: true,
        temperature: 0.6,
        max_tokens: 1500,
      }),
    }
  );

  if (!openAiResponse.ok) {
    let message = "AI Agent 服務暫時無法使用，請稍後再試。";
    try {
      const errorBody = (await openAiResponse.json()) as {
        error?: { message?: string };
      };
      if (errorBody.error?.message) {
        message = errorBody.error.message;
      }
    } catch {
      // Use fallback message.
    }

    return jsonError(message, 502);
  }

  return createOpenAIStreamResponse(openAiResponse);
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
