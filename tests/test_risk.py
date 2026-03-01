from datetime import datetime, timezone, timedelta

from app.core.config import RiskConfig
from app.risk.manager import PortfolioState, RiskManager


def test_size_reduces_with_low_confidence_and_limits_position():
    rm = RiskManager(RiskConfig(max_position_usd=100))
    state = PortfolioState(position_usd=20)
    assert rm.size_order(100, 0.5, state) == 50
    state.position_usd = 95
    assert rm.size_order(100, 0.9, state) == 5


def test_guardrail_stale_feed_blocks_trading():
    rm = RiskManager(RiskConfig(max_stale_seconds=1))
    state = PortfolioState(last_feed_ts=datetime.now(timezone.utc) - timedelta(seconds=10))
    assert rm.can_trade(state) is False
