from __future__ import annotations

from datetime import datetime, timezone

from app.core.models import MarketQuote, Signal
from app.strategies.base import Strategy


class SimilarMarketConvergence(Strategy):
    name = "convergence"

    def __init__(self):
        self.last_by_market: dict[str, float] = {}

    def mapping_confidence(self, market_id: str) -> float:
        # Example deterministic confidence: production would use semantic/entity mapping.
        return 0.6 if "similar" in market_id else 0.85

    def on_quote(self, quote: MarketQuote) -> list[Signal]:
        mid = (quote.bid + quote.ask) / 2
        prev = self.last_by_market.get(quote.market_id)
        self.last_by_market[quote.market_id] = mid
        if prev is None:
            return []
        divergence = abs(mid - prev)
        conf = self.mapping_confidence(quote.market_id)
        score = divergence * conf
        if score > 0.01:
            return [Signal(self.name, quote.market_id, score, f"convergence_conf={conf:.2f}", datetime.now(timezone.utc))]
        return []
