from __future__ import annotations

from datetime import datetime, timezone

from app.core.models import MarketQuote, Signal
from app.strategies.base import Strategy


class MispricingScanner(Strategy):
    name = "mispricing"

    def on_quote(self, quote: MarketQuote) -> list[Signal]:
        edge = (quote.ask - quote.bid) / max(quote.bid, 1e-6)
        if edge > 0.025:
            return [Signal(self.name, quote.market_id, edge, "spread_above_threshold", datetime.now(timezone.utc))]
        return []
