from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4


class Mode(str, Enum):
    SIMULATION = "simulation"
    DRY_RUN_LIVE = "dry-run-live"
    LIVE = "live"


class OrderStatus(str, Enum):
    CREATED = "CREATED"
    SUBMITTED = "SUBMITTED"
    ACKED = "ACKED"
    PARTIAL = "PARTIAL"
    FILLED = "FILLED"
    CANCEL_REQUESTED = "CANCEL_REQUESTED"
    CANCELED = "CANCELED"
    REJECTED = "REJECTED"


TERMINAL_ORDER_STATES = {OrderStatus.FILLED, OrderStatus.CANCELED, OrderStatus.REJECTED}


@dataclass(slots=True)
class MarketQuote:
    venue: str
    market_id: str
    bid: float
    ask: float
    ts: datetime


@dataclass(slots=True)
class Order:
    venue: str
    market_id: str
    side: str
    price: float
    quantity: float
    strategy: str
    idempotency_key: str
    id: str = field(default_factory=lambda: str(uuid4()))
    venue_order_id: str | None = None
    status: OrderStatus = OrderStatus.CREATED
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "venue": self.venue,
            "market_id": self.market_id,
            "side": self.side,
            "price": self.price,
            "quantity": self.quantity,
            "strategy": self.strategy,
            "idempotency_key": self.idempotency_key,
            "venue_order_id": self.venue_order_id,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


@dataclass(slots=True)
class Fill:
    order_id: str
    venue: str
    fill_price: float
    fill_qty: float
    fee: float
    ts: datetime


@dataclass(slots=True)
class Signal:
    strategy: str
    market_id: str
    score: float
    reason: str
    ts: datetime


@dataclass(slots=True)
class GuardrailState:
    stale_feed: bool = False
    latency_violation: bool = False
    drawdown_halt: bool = False
    daily_loss_halt: bool = False

