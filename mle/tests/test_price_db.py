"""Unit tests for price_db helpers (no live Yahoo / DB)."""

from __future__ import annotations
import pytest
import pandas as pd
from unittest.mock import MagicMock, patch  # MagicMock 用於模擬物件，patch 用於模擬函數
from price_db import (
    require_database_url,
    new_id,
    yahoo_ticker_for,
    fetch_daily_rows,
    upsert_rows,
)


# type=Crypto → Yahoo "-USD"; otherwise keep symbol (stocks/ETFs / missing type).
@pytest.mark.parametrize(
    ("symbol", "asset_type", "expected"),
    [
        ("AAPL", "Stock", "AAPL"),
        ("aapl", None, "AAPL"),
        ("VOO", "ETF", "VOO"),
        ("BTC", "Crypto", "BTC-USD"),
        ("eth", "Crypto", "ETH-USD"),
        ("XYZCOIN", "Crypto", "XYZCOIN-USD"),
        ("BTC", None, "BTC"),  # no Asset.type → no suffix (CLI --symbols edge case)
        ("  tsla  ", "Stock", "TSLA"),
    ],
)
def test_yahoo_ticker_for(symbol: str, asset_type: str | None, expected: str) -> None:
    # assert 的意思是我預期這個結果應該是這樣，如果不是，就代表測試失敗
    assert yahoo_ticker_for(symbol, asset_type) == expected


def test_new_id_prefix_and_uniqueness() -> None:
    a, b = new_id(), new_id()
    assert a.startswith("dmp_")  # assert 的意思是我預期這個結果應該是這樣，如果不是，就代表測試失敗
    assert b.startswith("dmp_")  # assert 的意思是我預期這個結果應該是這樣，如果不是，就代表測試失敗
    assert a != b


def test_require_database_url_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    # raising=False 表示如果環境變量不存在，也不要報錯
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with patch("price_db.load_dotenv_files"):
        with pytest.raises(RuntimeError, match="DATABASE_URL"):
            require_database_url()


def test_require_database_url_present(monkeypatch: pytest.MonkeyPatch) -> None:
    # setenv() 用於暫時設定環境變數
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
    with patch("price_db.load_dotenv_files"):
        assert require_database_url() == "postgresql://user:pass@localhost/db"


def test_upsert_rows_empty_returns_zero() -> None:
    assert upsert_rows("AAPL", []) == 0  # assert 的意思是我預期這個結果應該是這樣，如果不是，就代表測試失敗


def test_fetch_daily_rows_parses_history() -> None:
    # create a fake dataframe for testing
    idx = pd.to_datetime(["2024-01-02", "2024-01-03"])
    history = pd.DataFrame(
        {
            "Open": [100.0, 101.0],
            "High": [105.0, 106.0],
            "Low": [99.0, 100.0],
            "Close": [104.0, 105.0],
            "Adj Close": [104.0, 105.0],
            "Volume": [1_000_000, 1_100_000],
        },
        index=idx,
    )
    history.index.name = "Date"

    mock_ticker = MagicMock()  # create a mock object for testing
    # mock the history method to return the fake dataframe
    mock_ticker.history.return_value = history

    with patch("price_db.yf.Ticker", return_value=mock_ticker) as ticker_cls:
        rows = fetch_daily_rows("AAPL", "5d")

    ticker_cls.assert_called_once_with("AAPL")
    mock_ticker.history.assert_called_once_with(period="5d", auto_adjust=False)
    assert len(rows) == 2
    assert rows[0]["date"] == "2024-01-02"
    assert rows[0]["close"] == 104.0
    assert rows[0]["adjClose"] == 104.0
    assert rows[1]["volume"] == 1_100_000


def test_fetch_daily_rows_skips_non_positive_close() -> None:
    # create a fake dataframe for testing
    idx = pd.to_datetime(["2024-01-02", "2024-01-03"])
    history = pd.DataFrame(
        {
            "Open": [0.0, 10.0],
            "High": [0.0, 11.0],
            "Low": [0.0, 9.0],
            "Close": [0.0, 10.5],
            "Adj Close": [0.0, 10.5],
            "Volume": [0, 100],
        },
        index=idx,
    )
    history.index.name = "Date"

    mock_ticker = MagicMock()  # create a mock object for testing
    # mock the history method to return the fake dataframe
    mock_ticker.history.return_value = history

    with patch("price_db.yf.Ticker", return_value=mock_ticker):
        rows = fetch_daily_rows("BAD", "5d")

    assert len(rows) == 1
    assert rows[0]["date"] == "2024-01-03"


def test_fetch_daily_rows_empty_history() -> None:
    mock_ticker = MagicMock()
    mock_ticker.history.return_value = pd.DataFrame()

    with patch("price_db.yf.Ticker", return_value=mock_ticker):
        assert fetch_daily_rows("NONE", "5d") == []
