#!/usr/bin/env python3
"""Sync daily prices for portfolio symbols (or an explicit list) into DailyMarketPrice.

Examples:
  python scripts/sync_prices.py --period 1mo
  python scripts/sync_prices.py --symbols TSLA,AAPL,NVDA --period 1y
  python scripts/sync_prices.py --period 5d   # good for daily cron (recent bars only)
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

# Allow `python scripts/sync_prices.py` without installing a package.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from price_db import (  # noqa: E402
    fetch_daily_rows,
    load_portfolio_symbols,
    require_database_url,
    upsert_rows,
    yahoo_ticker_for,
)


def resolve_targets(
    symbols_arg: str | None,
) -> list[tuple[str, str | None]]:
    """Return list of (store_symbol, asset_type)."""
    if symbols_arg:
        return [(s.strip().upper(), None) for s in symbols_arg.split(",") if s.strip()]

    rows = load_portfolio_symbols()
    if not rows:
        print(
            "No Stock/ETF/Crypto symbols found in Asset. "
            "Add holdings in the dashboard, or pass --symbols TSLA,AAPL.",
            file=sys.stderr,
        )
        sys.exit(1)
    return [(symbol, asset_type) for symbol, asset_type in rows]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch Yahoo prices for portfolio symbols and upsert DailyMarketPrice."
    )
    parser.add_argument(
        "--symbols",
        default=None,
        help="Comma-separated tickers. Default: distinct symbols from Asset table.",
    )
    parser.add_argument(
        "--period",
        default="1mo",
        help="yfinance period (default: 1mo). Use 5d for daily incremental sync.",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.4,
        help="Seconds to sleep between symbols (default: 0.4).",
    )
    args = parser.parse_args()

    database_url = require_database_url()
    targets = resolve_targets(args.symbols)

    print(f"Syncing {len(targets)} symbol(s), period={args.period}")
    ok = 0
    failed = 0
    total_rows = 0

    for store_symbol, asset_type in targets:
        yahoo_symbol = yahoo_ticker_for(store_symbol, asset_type)
        try:
            rows = fetch_daily_rows(yahoo_symbol, args.period)
            if not rows:
                print(f"  SKIP {store_symbol} (yahoo={yahoo_symbol}): no data")
                failed += 1
                continue
            count = upsert_rows(store_symbol, rows, database_url=database_url)
            print(
                f"  OK   {store_symbol} (yahoo={yahoo_symbol}): upserted {count} row(s)"
            )
            ok += 1
            total_rows += count
        except Exception as exc:  # noqa: BLE001 — keep sync going per symbol
            print(f"  FAIL {store_symbol} (yahoo={yahoo_symbol}): {exc}", file=sys.stderr)
            failed += 1
        if args.sleep > 0:
            time.sleep(args.sleep)

    print(f"\nDone. ok={ok} failed={failed} rows={total_rows}")
    if failed and not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
