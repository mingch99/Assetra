#!/usr/bin/env python3
"""Sync daily prices for portfolio symbols (or an explicit list) into DailyMarketPrice. (Batch ETL Pipeline Implementation)

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
    require_database_url,
    yahoo_ticker_for,
    fetch_daily_rows,
    upsert_rows,
    load_portfolio_symbols,
)


# Resolve symbols from CLI or portfolio.
def resolve_targets(symbols_arg: str | None) -> list[tuple[str, str | None]]:
    """Return list of (store_symbol, asset_type)."""
    if symbols_arg:
        # split(",") 用於將字串分割成列表，if s.strip() 用於去除空格
        return [(s.strip().upper(), None) for s in symbols_arg.split(",") if s.strip()]

    rows = load_portfolio_symbols()
    if not rows:
        print(
            "No Stock/ETF/Crypto symbols found in Asset. "
            "Add holdings in the dashboard, or pass --symbols TSLA,AAPL.",
            file=sys.stderr,  # file=sys.stderr 用於將錯誤訊息寫入 stderr
        )
        sys.exit(1)  # sys.exit(1) 用於退出程式，並返回 1 表示程式執行失敗
    return [(symbol, asset_type) for symbol, asset_type in rows]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch Yahoo prices for portfolio symbols and upsert DailyMarketPrice."
    )

    # --symbols 用於指定要同步的 Symbols
    parser.add_argument(
        "--symbols",
        default=None,
        help="Comma-separated tickers. Default: distinct symbols from Asset table.",
    )
    # --period 用於指定要同步的 Period
    parser.add_argument(
        "--period",
        default="5d",
        help="yfinance period (default: 5d). Use 5d for daily incremental sync.",
    )
    # --sleep 用於指定要睡眠的時間
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.4,
        help="Seconds to sleep between symbols (default: 0.4).",
    )

    args = parser.parse_args()  # parser.parse_args() 用於解析命令行參數
    """
    input:
    python scripts/sync_prices.py \
        --symbols TSLA, AAPL, NVDA \
        --period 1y \
        --sleep 0.4

    output:
    args.symbols == "TSLA, AAPL, NVDA"
    args.period == "1y"
    args.sleep == 0.4
    """
    database_url = require_database_url()  # require_database_url() 用於獲取資料庫 URL
    targets = resolve_targets(args.symbols)  # resolve_targets() 用於解析命令行參數

    print(f"Syncing {len(targets)} symbol(s), period={args.period}")
    ok = 0
    failed = 0
    total_rows = 0

    # 遍歷所有Symbol，並取得Daily Market Price並存到DailyMarketPrice Table [ETL Pipeline]
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
            print(
                f"  FAIL {store_symbol} (yahoo={yahoo_symbol}): {exc}", file=sys.stderr)
            failed += 1
        if args.sleep > 0:
            time.sleep(args.sleep)

    print(f"\nDone. ok={ok} failed={failed} rows={total_rows}")
    if failed and not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
