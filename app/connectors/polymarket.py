from __future__ import annotations

from dataclasses import dataclass
import importlib
from typing import Any


@dataclass
class PolymarketConfig:
    host: str
    chain_id: int
    private_key: str | None
    proxy_address: str | None
    funder: str | None


class PolymarketClientWrapper:
    """Thin wrapper around py-clob-client for official CLOB order flow.

    Uses EIP-712 signing in py-clob-client. In dry-run-live mode we build/sign and auth,
    but intentionally do not submit orders.
    """

    def __init__(self, cfg: PolymarketConfig):
        self.cfg = cfg
        self.client: Any | None = None

    def connect(self) -> None:
        spec = importlib.util.find_spec("py_clob_client.client")
        if spec is None or not self.cfg.private_key:
            self.client = None
            return
        module = importlib.import_module("py_clob_client.client")
        ClobClient = getattr(module, "ClobClient")
        self.client = ClobClient(
            host=self.cfg.host,
            key=self.cfg.private_key,
            chain_id=self.cfg.chain_id,
            signature_type=0,
            funder=self.cfg.funder,
        )

    def create_api_credentials(self) -> dict | None:
        if not self.client:
            return None
        return self.client.create_or_derive_api_creds()

    def place_order(self, order_args: dict, dry_run: bool = True) -> dict:
        if not self.client:
            return {"status": "unavailable", "detail": "py-clob-client not configured"}
        signed_order = self.client.create_order(order_args)
        if dry_run:
            return {"status": "dry-run", "signed": str(signed_order)}
        result = self.client.post_order(signed_order)
        return {"status": "submitted", "result": result}
