# Assetra AI Agent

A self-contained AI agent module that holds the core logic for portfolio Q&A. **It has no dependency on the Assetra database or stores**, so it can be extracted later.

## Structure

```
ai-agent/                         ← can be extracted as a whole
├── types.ts                      # Shared types (no Assetra dependencies)
├── constants.ts                  # API path, suggestions, defaults
├── metrics/                      # Portfolio metric calculations
├── server/                       # Chat handler, OpenAI streaming, prompts
├── client/                       # Browser fetch + stream client
├── ui/
│   ├── AgentChatWidget.tsx       # Floating button + slide-out side panel
│   └── AgentChatPanel.tsx        # Chat content
└── index.ts                      # Public exports

lib/integrations/ai-agent/        ← stays in the Assetra app
└── portfolio-context-loader.ts   # Reads Assetra data and feeds it to ai-agent

app/api/ai-agent/chat/route.ts    # Thin route: auth + wiring + delegation
```

## Request flow

```
AgentChatWidget → sendAgentMessage (client/)
  → POST /api/ai-agent/chat
      ├─ getCurrentUser()                      # not signed in → 401
      ├─ loadPortfolioContextForAiAgent()      # build portfolio JSON
      └─ handleAgentChat()                     # build system prompt → OpenAI streaming
  ← text/plain stream back to the browser
```

- Model: `AI_AGENT_MODEL` (default `gpt-4o-mini`); requires `OPENAI_API_KEY`
- Language: English or Chinese system prompt based on the UI locale (`server/prompts.ts`)

## Portfolio context sent to the model

`server/context-summary.ts` serializes the following into JSON and embeds it in the system prompt:

| Section | Contents |
|---------|----------|
| `overview` | Total assets, cash, debt, real estate, net equity, unrealized P&L, liquid / non-liquid assets |
| `allocation` | Stock / ETF / crypto / cash / real-estate percentages and values |
| `cryptoBuckets` | BTC / ETH / stablecoins / altcoins |
| `baskets` | Market value and cost basis of the user's groups |
| `leverage` | Debt ratio, equity ratio |
| `holdings` | Per holding: quantity, avg cost, current price, market value, allocation, P&L, daily change |

Prices come from **live quotes** (Finnhub / CoinGecko).

### Known limitation

The agent **does not read** `DailyMarketPrice` / `MarketFeature` yet, so it can't answer questions that need history, such as "how volatile has my portfolio been this month?" or "which holdings are trending down?". This is the next step on the [roadmap](../../docs/product/roadmap.md#next): add each holding's latest `MarketFeature` and the result of `computePortfolioRisk()` in `portfolio-context-loader.ts` (`ai-agent/` itself still never touches the database).

## Boundaries

| Location | Owner | When extracted to a service |
|----------|-------|-----------------------------|
| `ai-agent/` | AI agent core | Moves out as a whole |
| `lib/integrations/ai-agent/` | Assetra integration layer | Stays in the app, or becomes an HTTP client |
| `app/api/ai-agent/chat/route.ts` | Assetra API entry point | Stays as a proxy, or calls the external service |

## Integration points

| File | Role |
|------|------|
| `app/api/ai-agent/chat/route.ts` | Auth, read env, load context, call `handleAgentChat` |
| `lib/integrations/ai-agent/portfolio-context-loader.ts` | Load portfolio context from Assetra stores |
| `app/dashboard/page.tsx` | Render `<AgentChatWidget />` |

## Extracting to a standalone service

1. Move `ai-agent/` to a new repo or npm package (`@assetra/ai-agent`).
2. The standalone service exposes `POST /chat` with `{ messages, portfolioContext }`.
3. Keep `portfolio-context-loader.ts` in Assetra; change the route to call the external service over HTTP.
4. Point `sendAgentMessage` at the external URL via `apiPath` or an env var.
