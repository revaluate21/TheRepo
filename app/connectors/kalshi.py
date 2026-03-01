from __future__ import annotations

import httpx


class KalshiPublicClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    async def list_markets(self) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{self.base_url}/markets")
            r.raise_for_status()
            return r.json()
