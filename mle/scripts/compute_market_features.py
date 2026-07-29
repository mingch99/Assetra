#!/usr/bin/env python3
"""Compute MarketFeature rows from DailyMarketPrice.

Features (trading-day windows; use adjClose when present, else close):
  - ma20:           20-day simple moving average
  - return7d / return30d / return1y (252d) / returnYtd
  - volatility7d / volatility30d / volatility1y / volatilityYtd (annualized × √252)

Examples:
  python scripts/compute_market_features.py
  python scripts/compute_market_features.py --symbols TSLA,AAPL
"""

from __future__ import annotations

import argparse
import math
import secrets
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import psycopg

sys.path.insert(0, str(Path(__file__).resolve().parent))

from price_db import require_database_url  # noqa: E402

TRADING_DAYS_PER_YEAR = 252.0
ANNUALIZATION = math.sqrt(TRADING_DAYS_PER_YEAR)
# Yahoo 1y history is often ~251 bars; 250 keeps the latest row fillable.
TRADING_DAYS_1Y = 250


def new_id() -> str:
    return f"mf_{secrets.token_hex(12)}"


def load_price_frame(
    conn: psycopg.Connection, symbols: list[str] | None
) -> pd.DataFrame:
    if symbols:
        cur = conn.execute(
            """
            SELECT "symbol", "date", "close", "adjClose"
            FROM "DailyMarketPrice"
            WHERE "symbol" = ANY(%s)
            ORDER BY "symbol", "date"
            """,
            (symbols,),
        )
    else:
        cur = conn.execute(
            """
            SELECT "symbol", "date", "close", "adjClose"
            FROM "DailyMarketPrice"
            ORDER BY "symbol", "date"
            """
        )
    rows = cur.fetchall()
    if not rows:
        return pd.DataFrame(columns=["symbol", "date", "close", "adjClose"])
    return pd.DataFrame(rows, columns=["symbol", "date", "close", "adjClose"])


def compute_features_for_symbol(df: pd.DataFrame) -> pd.DataFrame:
    """df must be one symbol, sorted by date."""
    out = df.copy()
    price = out["adjClose"].where(out["adjClose"].notna(), out["close"]).astype(float)
    out["price"] = price
    out["ma20"] = price.rolling(window=20, min_periods=20).mean()
    out["return7d"] = price / price.shift(7) - 1.0
    out["return30d"] = price / price.shift(30) - 1.0
    out["return1y"] = price / price.shift(TRADING_DAYS_1Y) - 1.0

    dates = pd.to_datetime(out["date"])
    year_start_price = price.groupby(dates.dt.year).transform("first")
    out["returnYtd"] = price / year_start_price - 1.0
    out.loc[dates == dates.groupby(dates.dt.year).transform("min"), "returnYtd"] = (
        float("nan")
    )

    daily_ret = price.pct_change()
    out["volatility7d"] = daily_ret.rolling(
        window=7, min_periods=7
    ).std() * ANNUALIZATION
    out["volatility30d"] = daily_ret.rolling(
        window=30, min_periods=30
    ).std() * ANNUALIZATION
    out["volatility1y"] = daily_ret.rolling(
        window=TRADING_DAYS_1Y, min_periods=TRADING_DAYS_1Y
    ).std() * ANNUALIZATION

    # YTD volatility: expanding std within each calendar year (from 2nd bar).
    ytd_vols: list[float] = []
    for year, group in daily_ret.groupby(dates.dt.year):
        vals: list[float] = []
        for value in group.tolist():
            if value == value:  # not NaN
                vals.append(float(value))
            if len(vals) >= 2:
                mean = sum(vals) / len(vals)
                var = sum((v - mean) ** 2 for v in vals) / (len(vals) - 1)
                ytd_vols.append(math.sqrt(var) * ANNUALIZATION)
            else:
                ytd_vols.append(float("nan"))
    out["volatilityYtd"] = ytd_vols

    return out


def upsert_features(conn: psycopg.Connection, frame: pd.DataFrame) -> int:
    if frame.empty:
        return 0

    now = datetime.now(timezone.utc)
    sql = """
        INSERT INTO "MarketFeature"
            ("id", "symbol", "date", "ma20", "return7d", "return30d",
             "returnYtd", "return1y", "volatility7d", "volatility30d",
             "volatilityYtd", "volatility1y", "createdAt", "updatedAt")
        VALUES
            (%(id)s, %(symbol)s, %(date)s::date, %(ma20)s, %(return7d)s,
             %(return30d)s, %(returnYtd)s, %(return1y)s, %(volatility7d)s,
             %(volatility30d)s, %(volatilityYtd)s, %(volatility1y)s,
             %(createdAt)s, %(updatedAt)s)
        ON CONFLICT ("symbol", "date") DO UPDATE SET
            "ma20" = EXCLUDED."ma20",
            "return7d" = EXCLUDED."return7d",
            "return30d" = EXCLUDED."return30d",
            "returnYtd" = EXCLUDED."returnYtd",
            "return1y" = EXCLUDED."return1y",
            "volatility7d" = EXCLUDED."volatility7d",
            "volatility30d" = EXCLUDED."volatility30d",
            "volatilityYtd" = EXCLUDED."volatilityYtd",
            "volatility1y" = EXCLUDED."volatility1y",
            "updatedAt" = EXCLUDED."updatedAt"
    """

    payloads: list[dict] = []
    for row in frame.itertuples(index=False):
        date_value = row.date
        date_str = (
            date_value.isoformat()
            if hasattr(date_value, "isoformat")
            else str(date_value)[:10]
        )

        def nullable(value: object) -> float | None:
            if value is None or (isinstance(value, float) and math.isnan(value)):
                return None
            return float(value)

        payloads.append(
            {
                "id": new_id(),
                "symbol": row.symbol,
                "date": date_str,
                "ma20": nullable(row.ma20),
                "return7d": nullable(row.return7d),
                "return30d": nullable(row.return30d),
                "returnYtd": nullable(row.returnYtd),
                "return1y": nullable(row.return1y),
                "volatility7d": nullable(row.volatility7d),
                "volatility30d": nullable(row.volatility30d),
                "volatilityYtd": nullable(row.volatilityYtd),
                "volatility1y": nullable(row.volatility1y),
                "createdAt": now,
                "updatedAt": now,
            }
        )

    with conn.cursor() as cur:
        cur.executemany(sql, payloads)
    return len(payloads)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compute returns / volatility into MarketFeature."
    )
    parser.add_argument(
        "--symbols",
        default=None,
        help="Comma-separated tickers. Default: all symbols in DailyMarketPrice.",
    )
    args = parser.parse_args()

    symbols = (
        [s.strip().upper() for s in args.symbols.split(",") if s.strip()]
        if args.symbols
        else None
    )

    database_url = require_database_url()
    with psycopg.connect(database_url) as conn:
        prices = load_price_frame(conn, symbols)
        if prices.empty:
            print("No DailyMarketPrice rows found.", file=sys.stderr)
            sys.exit(1)

        symbol_list = sorted(prices["symbol"].unique())
        print(f"Computing features for {len(symbol_list)} symbol(s)")

        total = 0
        with_vol = 0
        for symbol, group in prices.groupby("symbol", sort=True):
            features = compute_features_for_symbol(group.reset_index(drop=True))
            count = upsert_features(conn, features)
            vol_ready = int(features["volatility30d"].notna().sum())
            print(
                f"  OK   {symbol}: upserted {count} row(s), "
                f"vol30d ready={vol_ready}"
            )
            total += count
            with_vol += vol_ready

        conn.commit()

    print(f"\nDone. rows={total} volatility30d_non_null={with_vol}")


if __name__ == "__main__":
    main()
