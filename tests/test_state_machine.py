import pytest

from app.core.models import Order, OrderStatus
from app.core.state_machine import InvalidTransitionError, transition


def test_happy_path_transitions():
    o = Order(venue="sim", market_id="m", side="BUY", price=0.5, quantity=10, strategy="s", idempotency_key="k")
    transition(o, OrderStatus.SUBMITTED)
    transition(o, OrderStatus.ACKED)
    transition(o, OrderStatus.PARTIAL)
    transition(o, OrderStatus.FILLED)
    assert o.status == OrderStatus.FILLED


def test_invalid_transition_raises():
    o = Order(venue="sim", market_id="m", side="BUY", price=0.5, quantity=10, strategy="s", idempotency_key="k")
    with pytest.raises(InvalidTransitionError):
        transition(o, OrderStatus.FILLED)
