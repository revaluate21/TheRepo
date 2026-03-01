from __future__ import annotations

from app.core.models import MarketQuote, Signal


class Strategy:
    name = "base"

    def on_quote(self, quote: MarketQuote) -> list[Signal]:
        return []
