"""Shared helpers for Yahoo → DailyMarketPrice ingestion."""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timezone
from pathlib import Path

import psycopg
import yfinance as yf

# Asset.symbol (app) → Yahoo Finance ticker when they differ
CRYPTO_YAHOO_TICKERS: dict[str, str] = {
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "SOL": "SOL-USD",
    "XRP": "XRP-USD",
    "ADA": "ADA-USD",
    "DOGE": "DOGE-USD",
    "AVAX": "AVAX-USD",
    "SUI": "SUI-USD",
    "CRO": "CRO-USD",
    "USDT": "USDT-USD",
    "USDC": "USDC-USD",
}


def load_dotenv_files() -> None:
    root = Path(__file__).resolve().parents[2]
    candidates = [
        Path(__file__).resolve().parents[1] / ".env",
        root / "frontend" / ".env",
    ]
    for path in candidates:
        if not path.is_file():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def require_database_url() -> str:
    load_dotenv_files()
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        raise RuntimeError(
            "Missing DATABASE_URL. Set it in frontend/.env or the environment."
        )
    return url


def new_id() -> str:
    return f"dmp_{secrets.token_hex(12)}"

# Transform Symbol to Yahoo Finance ticker [Transform]


def yahoo_ticker_for(symbol: str, asset_type: str | None = None) -> str:
    symbol = symbol.upper().strip()
    if asset_type == "Crypto" or symbol in CRYPTO_YAHOO_TICKERS:
        return CRYPTO_YAHOO_TICKERS.get(symbol, f"{symbol}-USD")
    return symbol


# Yahoo Finance取得所有Symbol的Daily Market Price [Extract]
def fetch_daily_rows(yahoo_symbol: str, period: str) -> list[dict]:
    history = yf.Ticker(yahoo_symbol).history(period=period, auto_adjust=False)
    if history.empty:
        return []

    # 將index轉換為欄位 [Transform]
    history = history.reset_index()
    date_col = "Date" if "Date" in history.columns else history.columns[0]
    rows: list[dict] = []

    for _, row in history.iterrows():
        date_value = row[date_col]
        date_str = (
            date_value.date().isoformat()
            if hasattr(date_value, "date")
            else str(date_value)[:10]
        )
        close = float(row["Close"])
        if close <= 0:
            continue
        adj = row["Adj Close"] if "Adj Close" in history.columns else None
        volume = row["Volume"]
        rows.append(
            {
                "date": date_str,
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": close,
                "adjClose": float(adj) if adj == adj else None,
                "volume": int(volume) if volume == volume else 0,
            }
        )
    return rows


# Upsert DailyMarketPrice [Load]
def upsert_rows(store_symbol: str, rows: list[dict], database_url: str | None = None) -> int:
    if not rows:
        return 0
    url = database_url or require_database_url()
    now = datetime.now(timezone.utc)
    sql = """
        INSERT INTO "DailyMarketPrice"
            ("id", "symbol", "date", "open", "high", "low", "close",
             "adjClose", "volume", "source", "createdAt", "updatedAt")
        VALUES
            (%(id)s, %(symbol)s, %(date)s::date, %(open)s, %(high)s, %(low)s,
             %(close)s, %(adjClose)s, %(volume)s, %(source)s, %(createdAt)s, %(updatedAt)s)
        ON CONFLICT ("symbol", "date") DO UPDATE SET
            "open" = EXCLUDED."open",
            "high" = EXCLUDED."high",
            "low" = EXCLUDED."low",
            "close" = EXCLUDED."close",
            "adjClose" = EXCLUDED."adjClose",
            "volume" = EXCLUDED."volume",
            "source" = EXCLUDED."source",
            "updatedAt" = EXCLUDED."updatedAt"
    """
    payloads = [
        {
            "id": new_id(),
            "symbol": store_symbol,
            "date": row["date"],
            "open": row["open"],
            "high": row["high"],
            "low": row["low"],
            "close": row["close"],
            "adjClose": row["adjClose"],
            "volume": row["volume"],
            "source": "yahoo",
            "createdAt": now,
            "updatedAt": now,
        }
        for row in rows
    ]
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.executemany(sql, payloads)
        conn.commit()
    return len(payloads)


# 從Asset Table取得所有Symbol，目的是要把Symbol餵給Yahoo Finance取得所有Symbol的Daily Market Price [Extract]
def load_portfolio_symbols(database_url: str | None = None) -> list[tuple[str, str]]:
    """Return distinct (symbol, type) from Asset for Stock / ETF / Crypto."""
    url = database_url or require_database_url()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT "symbol", "type"::text
                FROM "Asset"
                WHERE "type" IN ('Stock', 'ETF', 'Crypto')
                ORDER BY "symbol"
                """
            )
            return [(row[0].upper().strip(), row[1]) for row in cur.fetchall()]
