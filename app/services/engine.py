from __future__ import annotations

import asyncio
from dataclasses import asdict
from datetime import datetime, timezone
import hashlib

from app.connectors.simulated import SimulatedFeed
from app.connectors.news import NewsIngestor
from app.core.config import Settings
from app.core.models import Fill, Mode, Order, OrderStatus
from app.core.state_machine import transition
from app.risk.manager import PortfolioState, RiskManager
from app.storage.db import Database
from app.storage.journal import Journal
from app.strategies.convergence import SimilarMarketConvergence
from app.strategies.mispricing import MispricingScanner
from app.strategies.news_shock import NewsShockMonitor
from app.strategies.spread_capture import SpreadCaptureLP


class Engine:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.db = Database(settings.db_path)
        self.db.init()
        self.journal = Journal(settings.journal_path)
        self.risk = RiskManager(settings.risk)
        self.portfolio = PortfolioState()
        self.feed = SimulatedFeed(seed=settings.sim_seed)
        self.news = NewsIngestor(settings.rss_feeds.split(","), x_bearer_token=settings.x_bearer_token)
        self.strategies = [MispricingScanner(), SimilarMarketConvergence(), SpreadCaptureLP()]
        self.news_strategy = NewsShockMonitor()
        self.running = False
        self.toggles = {s.name: True for s in self.strategies}
        self.toggles[self.news_strategy.name] = True
        self.events: asyncio.Queue = asyncio.Queue()

    def _idempotency_key(self, venue: str, market_id: str, side: str, price: float, qty: float) -> str:
        raw = f"{venue}|{market_id}|{side}|{price:.4f}|{qty:.4f}|{datetime.now(timezone.utc).date().isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:24]

    def _persist_order(self, order: Order) -> None:
        self.db.execute(
            """INSERT OR REPLACE INTO orders
            (id,venue,market_id,side,price,quantity,strategy,idempotency_key,venue_order_id,status,created_at,updated_at)
            VALUES (:id,:venue,:market_id,:side,:price,:quantity,:strategy,:idempotency_key,:venue_order_id,:status,:created_at,:updated_at)""",
            order.as_dict(),
        )
        self.journal.append("order", order.as_dict())

    def _persist_fill(self, fill: Fill) -> None:
        self.db.execute(
            """INSERT INTO fills (order_id,venue,fill_price,fill_qty,fee,ts)
            VALUES (:order_id,:venue,:fill_price,:fill_qty,:fee,:ts)""",
            {
                "order_id": fill.order_id,
                "venue": fill.venue,
                "fill_price": fill.fill_price,
                "fill_qty": fill.fill_qty,
                "fee": fill.fee,
                "ts": fill.ts.isoformat(),
            },
        )
        self.journal.append("fill", asdict(fill))

    async def submit_order(self, strategy: str, market_id: str, venue: str, side: str, price: float, qty: float) -> Order:
        key = self._idempotency_key(venue, market_id, side, price, qty)
        existing = self.db.fetch_all("SELECT * FROM orders WHERE idempotency_key=:k", {"k": key})
        if existing:
            return Order(
                id=existing[0]["id"], venue=venue, market_id=market_id, side=side, price=price, quantity=qty,
                strategy=strategy, idempotency_key=key, status=OrderStatus(existing[0]["status"])
            )

        order = Order(venue=venue, market_id=market_id, side=side, price=price, quantity=qty, strategy=strategy, idempotency_key=key)
        self._persist_order(order)
        transition(order, OrderStatus.SUBMITTED)
        self._persist_order(order)
        transition(order, OrderStatus.ACKED)
        self._persist_order(order)
        fill = Fill(order_id=order.id, venue=venue, fill_price=price, fill_qty=qty, fee=0.02 * qty, ts=datetime.now(timezone.utc))
        transition(order, OrderStatus.FILLED)
        self._persist_order(order)
        self._persist_fill(fill)
        self.portfolio.realized_pnl += (0.5 - price) * qty if side == "BUY" else (price - 0.5) * qty
        self.portfolio.position_usd += qty * price if side == "BUY" else -qty * price
        return order

    async def reconciliation_loop(self) -> None:
        while self.running:
            # In production this queries venue open orders/fills; here we verify local consistency.
            mismatches = self.db.fetch_all(
                "SELECT id,status FROM orders WHERE status NOT IN ('FILLED','CANCELED','REJECTED')"
            )
            self.journal.append("reconciliation", {"open_orders": len(mismatches)})
            await asyncio.sleep(5)

    async def market_loop(self) -> None:
        while self.running:
            q1 = self.feed.next_quote("polymarket", "election-2028")
            q2 = self.feed.next_quote("kalshi", "election-2028-similar")
            self.portfolio.last_feed_ts = datetime.now(timezone.utc)
            self.portfolio.latency_ms = 40
            for q in (q1, q2):
                self.journal.append("quote", {"venue": q.venue, "market_id": q.market_id, "bid": q.bid, "ask": q.ask, "ts": q.ts.isoformat()})
                for strat in self.strategies:
                    if not self.toggles.get(strat.name, True):
                        continue
                    for sig in strat.on_quote(q):
                        self.db.execute(
                            "INSERT INTO signals(strategy,market_id,score,reason,ts) VALUES (:s,:m,:sc,:r,:t)",
                            {"s": sig.strategy, "m": sig.market_id, "sc": sig.score, "r": sig.reason, "t": sig.ts.isoformat()},
                        )
                        self.journal.append("signal", {"strategy": sig.strategy, "market_id": sig.market_id, "score": sig.score, "reason": sig.reason})
                        if self.risk.can_trade(self.portfolio):
                            size = self.risk.size_order(50, 0.8, self.portfolio)
                            if size > 0:
                                await self.submit_order(sig.strategy, q.market_id, q.venue, "BUY", q.ask, size)
            if self.toggles.get(self.news_strategy.name, True):
                for sig in self.news_strategy.from_headlines(self.news.fetch()):
                    self.journal.append("alert", {"strategy": sig.strategy, "reason": sig.reason, "score": sig.score})
            await self.events.put({"type": "tick", "ts": datetime.now(timezone.utc).isoformat()})
            await asyncio.sleep(max(0.3, 1 / self.settings.sim_speed))

    async def start(self) -> None:
        self.running = True
        await asyncio.gather(self.market_loop(), self.reconciliation_loop())

    def stop(self) -> None:
        self.running = False

    def snapshot(self) -> dict:
        guards = self.risk.evaluate(self.portfolio)
        return {
            "mode": self.settings.mode,
            "balance": self.portfolio.balance,
            "realized_pnl": self.portfolio.realized_pnl,
            "unrealized_pnl": self.portfolio.unrealized_pnl,
            "latency_ms": self.portfolio.latency_ms,
            "feed_health": "STALE" if guards.stale_feed else "OK",
            "guardrails": asdict(guards),
            "toggles": self.toggles,
            "orders": self.db.fetch_all("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50"),
            "fills": self.db.fetch_all("SELECT * FROM fills ORDER BY ts DESC LIMIT 50"),
            "signals": self.db.fetch_all("SELECT * FROM signals ORDER BY ts DESC LIMIT 50"),
        }

    def set_toggle(self, strategy: str, enabled: bool) -> None:
        self.toggles[strategy] = enabled
        self.journal.append("toggle", {"strategy": strategy, "enabled": enabled})
