# Setup & deployment

---

## Prerequisites

- Node.js 20+
- PostgreSQL — [Neon](https://neon.tech/) recommended; use the **pooled** connection string (host contains `-pooler`)
- Python 3.12 (only for the market data ETL)

---

## Local development

```bash
git clone https://github.com/mingch99/Assetra.git
cd Assetra/frontend
cp .env.example .env
npm install              # also runs `prisma generate`
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and you land on `/dashboard`.

| Command (in `frontend/`) | Does |
|--------------------------|------|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + `prisma migrate deploy` + `next build` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse tables in Prisma Studio |

---

## Environment variables

Defined in [`frontend/.env.example`](../frontend/.env.example). The ETL also reads `DATABASE_URL` from `frontend/.env`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres connection string (Neon pooled) |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL used in password-reset links |
| `FINNHUB_API_KEY` | For US quotes | Live quotes, symbol search, daily closes for backfill/history |
| `OPENAI_API_KEY` | For AI advisor | OpenAI chat completions |
| `AI_AGENT_MODEL` | No | Overrides default model (`gpt-4o-mini`) |
| `RESEND_API_KEY` | No | Sends reset emails; without it the link is logged to the server console |
| `RESEND_FROM_EMAIL` | No | Sender address for reset emails |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` | For broker import | Plaid credentials |
| `PLAID_ENV` | For broker import | `sandbox` or `production` |
| `PLAID_WEBHOOK_URL` | No | Points Plaid at `/api/broker/webhook` for auto-sync |
| `BROKER_TOKEN_ENCRYPTION_KEY` | For broker import | Long random secret; encrypts Plaid access tokens at rest |

Features whose keys are missing degrade gracefully (e.g. no quotes, Plaid button reports "not configured").

---

## Market data ETL

```bash
cd mle
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python scripts/sync_prices.py --period 1y        # first run: backfill
python scripts/compute_market_features.py
```

Details and tests: [`mle/README.md`](../mle/README.md).

**Scheduled run:** [`.github/workflows/sync-daily-prices.yml`](../.github/workflows/sync-daily-prices.yml) runs weekdays 22:00 UTC. Add a repository secret `DATABASE_URL` (GitHub → Settings → Secrets and variables → Actions) with the same pooled URL.

---

## Deploy to Vercel

1. Import the repository and set **Root Directory** to `frontend`.
2. Add the environment variables above (Project Settings → Environment Variables).
3. Build command is the default `npm run build`, which runs migrations before `next build`.
4. Set `NEXT_PUBLIC_APP_URL` to the production URL.
5. Add the `DATABASE_URL` GitHub secret so the daily ETL writes to the same database.

**Common issue:** `P1001: can't reach database` during build usually means a non-pooled Neon host was used.

---

## Inspecting data

```bash
cd frontend && npx prisma studio
```

Or in the Neon SQL editor:

```sql
SELECT symbol, COUNT(*), MIN(date), MAX(date)
FROM "DailyMarketPrice"
GROUP BY symbol
ORDER BY symbol;
```
