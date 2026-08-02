"""
Shared helpers for Yahoo → DailyMarketPrice ingestion.
ETL pipeline: Extract, Transform, Load.

從資料庫找出使用者持有的資產代號，轉換成 Yahoo Finance 能理解的 ticker，抓取歷史價格，清理格式，最後寫回 PostgreSQL。
Asset Table
   ↓
load_portfolio_symbols()
   ↓
yahoo_ticker_for()
   ↓
fetch_daily_rows()
   ↓
upsert_rows()
   ↓
DailyMarketPrice Table
"""
from __future__ import annotations
import os
import secrets
import psycopg
import pandas as pd
import yfinance as yf
from pathlib import Path
from datetime import datetime, timezone


# Load environment variables from .env files
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


# Require DATABASE_URL environment variable
def require_database_url() -> str:
    load_dotenv_files()
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        raise RuntimeError(
            "Missing DATABASE_URL. Set it in frontend/.env or the environment."
        )
    return url


# Generate a new unique ID for DailyMarketPrice
def new_id() -> str:
    return f"dmp_{secrets.token_hex(12)}"  # dmp mean DailyMarketPrice


# Transform Asset.symbol → Yahoo Finance ticker.
# Crypto symbols from CoinGecko are stored as BTC/ETH/...; Yahoo needs BTC-USD.
# asset_type comes from Asset.type on portfolio sync — required for the -USD suffix.
def yahoo_ticker_for(symbol: str, asset_type: str | None = None) -> str:
    symbol = symbol.upper().strip()
    if asset_type == "Crypto":
        return f"{symbol}-USD"
    return symbol


# Fetch daily rows from Yahoo Finance [Extract]
def fetch_daily_rows(yahoo_symbol: str, period: str) -> list[dict]:
    history = yf.Ticker(yahoo_symbol).history(period=period, auto_adjust=False)
    if history.empty:
        return []

    # Transform index to columns [Transform]
    # reset_index() 將 index 轉換為欄位 (Yahoo 的 index 欄位是 date)
    history = history.reset_index()
    date_col = "Date" if "Date" in history.columns else history.columns[0]
    rows: list[dict] = []

    # _ 是 index，row 是 row data
    # iterrows() 是 pandas 的函數，用於遍歷 DataFrame 的每一行
    for _, row in history.iterrows():
        date_value = row[date_col]
        date_str = (
            date_value.date().isoformat()  # isoformat() 將日期轉換為 ISO 格式 (YYYY-MM-DD)
            # hasattr() 檢查 date_value 是否有 date 屬性
            if hasattr(date_value, "date")
            # str(date_value)[:10] 將日期轉換為字串，並取前10個字符 (YYYY-MM-DD)
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
                "adjClose": float(adj) if pd.notna(adj) else None,
                "volume": int(volume) if pd.notna(volume) else 0,
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
    # psycopg.connect() 連接 PostgreSQL 資料庫
    with psycopg.connect(url) as conn:  # with 語句用於確保結束後會自動關閉 connection)
        with conn.cursor() as cur:  # cursor 用於執行 SQL 語句
            # executemany() 用於執行多個 SQL 語句 (對每一個 payload 執行相同 SQL)
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
            # row: (symbol, type)
            # fetchall() 用於獲取所有查詢結果
            return [(row[0].upper().strip(), row[1]) for row in cur.fetchall()]
