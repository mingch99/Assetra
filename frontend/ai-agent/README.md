# Assetra AI Agent

可獨立拆出的 AI Agent 模組，負責投資組合問答的核心邏輯。**不含任何 Assetra DB / store 依賴。**

## Structure

```
ai-agent/                         ← 未來可整包拆出
├── types.ts                      # Shared types (no Assetra dependencies)
├── constants.ts                  # API path, suggestions, defaults
├── metrics/                      # Portfolio metric calculations
├── server/                       # Chat handler, OpenAI streaming, prompts
├── client/                       # Browser fetch + stream client
├── ui/
│   ├── AgentChatWidget.tsx       # 右下角按鈕 + 右側滑出面板
│   └── AgentChatPanel.tsx        # 聊天內容
└── index.ts                      # Public exports

lib/integrations/ai-agent/        ← 留在 Assetra 主程式
└── portfolio-context-loader.ts   # 從 Assetra DB 讀資料，餵給 ai-agent

app/api/ai-agent/chat/route.ts    # 薄路由：auth + 接合 + 委派
```

## 邊界原則

| 位置 | 歸屬 | 拆服務時 |
|------|------|----------|
| `ai-agent/` | AI Agent 核心 | 整包移出 |
| `lib/integrations/ai-agent/` | Assetra 接合層 | 留在主程式，或改成 HTTP client |
| `app/api/ai-agent/chat/route.ts` | Assetra API 入口 | 留作主程式 proxy，或改呼叫外部服務 |

## Integration points

| File | Role |
|------|------|
| `app/api/ai-agent/chat/route.ts` | Auth、讀 env、載入 context、呼叫 `handleAgentChat` |
| `lib/integrations/ai-agent/portfolio-context-loader.ts` | 從 Assetra stores 載入投資組合 context |
| `app/dashboard/page.tsx` | 渲染 `<AgentChatWidget />` |

## Extracting to a standalone service

1. Move `ai-agent/` to a new repo or npm package (`@assetra/ai-agent`).
2. Standalone service exposes `POST /chat` with `{ messages, portfolioContext }`.
3. Keep `portfolio-context-loader.ts` in Assetra; change route to HTTP-call the external service.
4. Point `sendAgentMessage` at the external URL via `apiPath` or env var.
