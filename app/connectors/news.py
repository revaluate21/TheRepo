from __future__ import annotations

from xml.etree import ElementTree
from urllib.request import urlopen


class NewsIngestor:
    def __init__(self, feeds: list[str], x_bearer_token: str | None = None):
        self.feeds = [f for f in feeds if f]
        self.x_bearer_token = x_bearer_token

    def fetch(self) -> list[dict]:
        if self.x_bearer_token:
            # Official X API only; no scraping.
            return [{"source": "x", "headline": "X API configured (integrate official endpoint calls)."}]
        out = []
        for url in self.feeds:
            try:
                with urlopen(url, timeout=3) as resp:
                    data = resp.read()
                root = ElementTree.fromstring(data)
                for item in root.findall('.//item')[:5]:
                    title = item.findtext('title') or ''
                    link = item.findtext('link') or ''
                    out.append({"source": "rss", "headline": title, "url": link})
            except Exception:
                continue
        return out
