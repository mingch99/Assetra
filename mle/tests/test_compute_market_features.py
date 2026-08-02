"""Unit tests for MarketFeature calculations (no database)."""

from __future__ import annotations

import math

import pandas as pd
import pytest

from compute_market_features import (
    ANNUALIZATION,
    TRADING_DAYS_1Y,
    compute_features_for_symbol,
)


def _price_frame(prices: list[float], start: str = "2024-01-02") -> pd.DataFrame:
    dates = pd.bdate_range(start=start, periods=len(prices))
    return pd.DataFrame(
        {
            "symbol": ["TEST"] * len(prices),
            "date": dates.date,
            "close": prices,
            "adjClose": prices,
        }
    )


def test_ma20_and_returns_with_constant_prices() -> None:
    prices = [100.0] * 40
    out = compute_features_for_symbol(_price_frame(prices))

    assert out["ma20"].iloc[:19].isna().all()
    assert out["ma20"].iloc[19] == pytest.approx(100.0)
    assert out["return7d"].iloc[7] == pytest.approx(0.0)
    assert out["return30d"].iloc[30] == pytest.approx(0.0)
    # Flat series → realized vol windows are ~0 after enough bars
    assert out["volatility7d"].iloc[7] == pytest.approx(0.0)
    assert out["volatility30d"].iloc[30] == pytest.approx(0.0)


def test_return7d_known_move() -> None:
    # 8 bars: flat then +10% on the last day vs 7 days prior
    prices = [100.0] * 7 + [110.0]
    out = compute_features_for_symbol(_price_frame(prices))
    assert math.isnan(out["return7d"].iloc[6])
    assert out["return7d"].iloc[7] == pytest.approx(0.10)


def test_prefers_adj_close_over_close() -> None:
    dates = pd.bdate_range(start="2024-01-02", periods=8)
    df = pd.DataFrame(
        {
            "symbol": ["ADJ"] * 8,
            "date": dates.date,
            "close": [100.0] * 8,
            "adjClose": [50.0] * 7 + [55.0],
        }
    )
    out = compute_features_for_symbol(df)
    assert out["return7d"].iloc[7] == pytest.approx(0.10)


def test_falls_back_to_close_when_adj_missing() -> None:
    dates = pd.bdate_range(start="2024-01-02", periods=8)
    df = pd.DataFrame(
        {
            "symbol": ["CL"] * 8,
            "date": dates.date,
            "close": [100.0] * 7 + [110.0],
            "adjClose": [float("nan")] * 8,
        }
    )
    out = compute_features_for_symbol(df)
    assert out["return7d"].iloc[7] == pytest.approx(0.10)


def test_return_ytd_resets_each_calendar_year() -> None:
    # Last trading day of 2023 then a few days in 2024
    dates = list(pd.bdate_range(start="2023-12-28", periods=2)) + list(
        pd.bdate_range(start="2024-01-02", periods=3)
    )
    prices = [100.0, 110.0, 200.0, 210.0, 220.0]
    df = pd.DataFrame(
        {
            "symbol": ["YTD"] * 5,
            "date": [d.date() for d in dates],
            "close": prices,
            "adjClose": prices,
        }
    )
    out = compute_features_for_symbol(df)

    # First bar of each year is NaN by design
    assert math.isnan(out["returnYtd"].iloc[0])
    assert out["returnYtd"].iloc[1] == pytest.approx(0.10)  # 110/100 - 1
    assert math.isnan(out["returnYtd"].iloc[2])  # first day of 2024
    assert out["returnYtd"].iloc[3] == pytest.approx(0.05)  # 210/200 - 1
    assert out["returnYtd"].iloc[4] == pytest.approx(0.10)  # 220/200 - 1


def test_volatility7d_annualization_factor() -> None:
    # Alternating returns create non-zero std; check annualization scaling
    prices = [100.0]
    for i in range(10):
        prices.append(prices[-1] * (1.01 if i % 2 == 0 else 0.99))
    out = compute_features_for_symbol(_price_frame(prices))
    daily = pd.Series(prices).pct_change()
    expected = daily.iloc[1:8].std(ddof=1) * ANNUALIZATION
    assert out["volatility7d"].iloc[7] == pytest.approx(expected)


def test_return1y_needs_full_window() -> None:
    n = TRADING_DAYS_1Y + 1
    prices = [100.0] * TRADING_DAYS_1Y + [120.0]
    out = compute_features_for_symbol(_price_frame(prices, start="2023-01-03"))
    assert out["return1y"].iloc[: TRADING_DAYS_1Y].isna().all()
    assert out["return1y"].iloc[-1] == pytest.approx(0.20)
    assert len(out) == n
