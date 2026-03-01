from __future__ import annotations

from datetime import datetime, timezone, timedelta
import random

from app.core.models import MarketQuote


class SimulatedFeed:
    """Deterministic pseudo-market data for safe local testing."""

    def __init__(self, seed: int = 42):
        self.rand = random.Random(seed)
        self.t = datetime.now(timezone.utc)
        self.mid = 0.5

    def next_quote(self, venue: str, market_id: str) -> MarketQuote:
        self.t += timedelta(seconds=1)
        shock = self.rand.uniform(-0.01, 0.01)
        self.mid = max(0.01, min(0.99, self.mid + shock))
        spread = 0.01 + abs(self.rand.uniform(0, 0.005))
        return MarketQuote(
            venue=venue,
            market_id=market_id,
            bid=max(0.001, self.mid - spread / 2),
            ask=min(0.999, self.mid + spread / 2),
            ts=self.t,
        )
