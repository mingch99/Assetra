// Public API — import from `@/ai-agent` when integrating with Assetra.
export { default as AgentChatWidget } from "@/ai-agent/ui/AgentChatWidget";
export { default as AgentChatPanel } from "@/ai-agent/ui/AgentChatPanel";
export { sendAgentMessage } from "@/ai-agent/client/send-message";
export { handleAgentChat } from "@/ai-agent/server/handle-chat";
export { buildContextSummary } from "@/ai-agent/server/context-summary";
export {
  AI_AGENT_API_PATH,
  AI_AGENT_SUGGESTIONS,
  AI_AGENT_WELCOME_MESSAGE,
  DEFAULT_AI_AGENT_MODEL,
} from "@/ai-agent/constants";
export type {
  AgentConfig,
  AgentMessage,
  AssetMetric,
  PortfolioAsset,
  PortfolioMetrics,
  PortfolioState,
  QuoteMap,
} from "@/ai-agent/types";
