from __future__ import annotations

from datetime import datetime, timezone

from app.core.models import MarketQuote, Signal
from app.strategies.base import Strategy


class SpreadCaptureLP(Strategy):
    name = "spread_capture"

    def on_quote(self, quote: MarketQuote) -> list[Signal]:
        spread = quote.ask - quote.bid
        if spread >= 0.015:
            return [Signal(self.name, quote.market_id, spread, "inventory_aware_quote_opportunity", datetime.now(timezone.utc))]
        return []
