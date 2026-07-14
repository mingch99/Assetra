export const AI_AGENT_API_PATH = "/api/ai-agent/chat";

export const AI_AGENT_SUGGESTIONS = [
  "分析我的資產配置是否合理",
  "哪些持股表現最好？哪些需要關注？",
  "我的投資組合風險分散程度如何？",
  "現金與負債比例是否健康？",
] as const;

export const DEFAULT_AI_AGENT_MODEL = "gpt-4o-mini";

export const AI_AGENT_WELCOME_MESSAGE =
  "你好！我是 Assetra Portfolio Advisor。我可以根據你目前的投資組合，協助分析資產配置、持股表現與風險狀況。請問有什麼想了解的？";
