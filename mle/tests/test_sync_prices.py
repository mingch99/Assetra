"""Unit tests for sync_prices target resolution (no network / DB)."""

from __future__ import annotations
import pytest
from unittest.mock import patch
from sync_prices import resolve_targets


def test_resolve_targets_from_cli_list() -> None:
    assert resolve_targets("tsla, AAPL,,nvda") == [
        ("TSLA", None),
        ("AAPL", None),
        ("NVDA", None),
    ]


def test_resolve_targets_from_portfolio() -> None:
    with patch(
        "sync_prices.load_portfolio_symbols",
        return_value=[("BTC", "Crypto"), ("AAPL", "Stock")],
    ):
        assert resolve_targets(None) == [("BTC", "Crypto"), ("AAPL", "Stock")]


def test_resolve_targets_exits_when_portfolio_empty() -> None:
    with patch("sync_prices.load_portfolio_symbols", return_value=[]):
        with pytest.raises(SystemExit) as exc:
            resolve_targets(None)
    assert exc.value.code == 1
