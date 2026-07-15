#!/usr/bin/env python3
"""Fetch daily historical prices from Yahoo Finance (yfinance) and print them.

Optional: upsert into DailyMarketPrice (Neon / PostgreSQL via DATABASE_URL).

For syncing every portfolio holding automatically, use sync_prices.py instead.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from price_db import fetch_daily_rows, upsert_rows  # noqa: E402


def print_rows(symbol: str, period: str, rows: list[dict]) -> None:
    print(f"symbol={symbol} period={period} source=yahoo rows={len(rows)}")
    print("-" * 72)
    print(f"{'date':<12} {'open':>10} {'high':>10} {'low':>10} {'close':>10} {'volume':>12}")
    print("-" * 72)
    for row in rows:
        print(
            f"{row['date']:<12} {row['open']:10.2f} {row['high']:10.2f} "
            f"{row['low']:10.2f} {row['close']:10.2f} {row['volume']:12d}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch Yahoo Finance daily prices; optionally write to DailyMarketPrice."
    )
    parser.add_argument("--symbol", default="TSLA", help="Ticker (default: TSLA)")
    parser.add_argument(
        "--period",
        default="1mo",
        help="yfinance period, e.g. 5d, 1mo, 3mo, 1y (default: 1mo)",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Upsert rows into DailyMarketPrice using DATABASE_URL",
    )
    args = parser.parse_args()

    symbol = args.symbol.upper().strip()
    rows = fetch_daily_rows(symbol, args.period)
    if not rows:
        print(f"No price data returned for {symbol!r}.", file=sys.stderr)
        sys.exit(1)

    print_rows(symbol, args.period, rows)

    if args.write:
        count = upsert_rows(symbol, rows)
        print(f"\nUpserted {count} row(s) into DailyMarketPrice for {symbol}.")


if __name__ == "__main__":
    main()
