import { DEFAULT_AI_AGENT_MODEL } from "@/ai-agent/constants";
import { handleAgentChat } from "@/ai-agent/server/handle-chat";
import { getCurrentUser } from "@/lib/auth-session";
import { loadPortfolioContextForAiAgent } from "@/lib/integrations/ai-agent/portfolio-context-loader";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "AI Agent 尚未設定。請在環境變數中加入 OPENAI_API_KEY。",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const portfolioContext = await loadPortfolioContextForAiAgent(user.id);
  const model =
    process.env.AI_AGENT_MODEL ??
    process.env.ADVISOR_MODEL ??
    DEFAULT_AI_AGENT_MODEL;

  return handleAgentChat(
    body,
    portfolioContext,
    {
      apiKey,
      model
    }
  );
}
