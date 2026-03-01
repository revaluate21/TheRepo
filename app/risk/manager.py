from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from app.core.config import RiskConfig
from app.core.models import GuardrailState


@dataclass
class PortfolioState:
    balance: float = 10_000.0
    realized_pnl: float = 0.0
    unrealized_pnl: float = 0.0
    peak_equity: float = 10_000.0
    daily_pnl: float = 0.0
    position_usd: float = 0.0
    last_feed_ts: datetime = datetime.now(timezone.utc)
    latency_ms: int = 0


class RiskManager:
    def __init__(self, cfg: RiskConfig):
        self.cfg = cfg
        self.guardrails = GuardrailState()

    def evaluate(self, state: PortfolioState) -> GuardrailState:
        equity = state.balance + state.realized_pnl + state.unrealized_pnl
        state.peak_equity = max(state.peak_equity, equity)
        dd_pct = 100 * (state.peak_equity - equity) / max(state.peak_equity, 1)

        self.guardrails.daily_loss_halt = state.daily_pnl <= -self.cfg.max_daily_loss_usd
        self.guardrails.drawdown_halt = dd_pct >= self.cfg.max_drawdown_pct
        self.guardrails.stale_feed = (datetime.now(timezone.utc) - state.last_feed_ts).total_seconds() > self.cfg.max_stale_seconds
        self.guardrails.latency_violation = state.latency_ms > self.cfg.max_latency_ms
        return self.guardrails

    def can_trade(self, state: PortfolioState) -> bool:
        g = self.evaluate(state)
        return not (g.stale_feed or g.latency_violation or g.drawdown_halt or g.daily_loss_halt)

    def size_order(self, desired_notional: float, mapping_confidence: float, state: PortfolioState) -> float:
        """Size down aggressively when confidence is low and enforce max position."""
        confidence_mult = max(0.1, min(1.0, mapping_confidence))
        allowed = max(0.0, self.cfg.max_position_usd - abs(state.position_usd))
        return max(0.0, min(desired_notional * confidence_mult, allowed))
