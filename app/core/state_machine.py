from __future__ import annotations

from datetime import datetime, timezone

from app.core.models import Order, OrderStatus


_ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.CREATED: {OrderStatus.SUBMITTED, OrderStatus.REJECTED},
    OrderStatus.SUBMITTED: {OrderStatus.ACKED, OrderStatus.REJECTED, OrderStatus.CANCEL_REQUESTED},
    OrderStatus.ACKED: {
        OrderStatus.PARTIAL,
        OrderStatus.FILLED,
        OrderStatus.CANCEL_REQUESTED,
        OrderStatus.REJECTED,
    },
    OrderStatus.PARTIAL: {OrderStatus.PARTIAL, OrderStatus.FILLED, OrderStatus.CANCEL_REQUESTED},
    OrderStatus.CANCEL_REQUESTED: {OrderStatus.CANCELED, OrderStatus.PARTIAL, OrderStatus.FILLED},
    OrderStatus.FILLED: set(),
    OrderStatus.CANCELED: set(),
    OrderStatus.REJECTED: set(),
}


class InvalidTransitionError(ValueError):
    """Raised when an order transition is invalid."""


def transition(order: Order, new_status: OrderStatus) -> Order:
    if new_status not in _ALLOWED_TRANSITIONS[order.status]:
        raise InvalidTransitionError(f"{order.status.value} -> {new_status.value} is not allowed")
    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)
    return order

