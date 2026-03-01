from __future__ import annotations

from datetime import datetime, timezone

from app.core.models import Signal


class NewsShockMonitor:
    name = "news_shock"

    def from_headlines(self, headlines: list[dict]) -> list[Signal]:
        out: list[Signal] = []
        for h in headlines:
            txt = h.get("headline", "").lower()
            if any(k in txt for k in ("breaking", "surge", "ban", "lawsuit", "rate")):
                out.append(Signal(self.name, "macro", 0.5, f"headline:{h.get('headline','')}", datetime.now(timezone.utc)))
        return out
