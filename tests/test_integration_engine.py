import asyncio

from app.core.config import Settings
from app.services.engine import Engine


def test_engine_generates_orders_and_handles_disconnect_like_stale_feed(tmp_path):
    settings = Settings(db_path=str(tmp_path / "t.db"), journal_path=str(tmp_path / "j.jsonl"), sim_speed=4.0)
    engine = Engine(settings)
    engine.running = True

    async def run_short():
        task = asyncio.create_task(engine.market_loop())
        await asyncio.sleep(0.7)
        engine.running = False
        await task

    asyncio.run(run_short())
    snapshot = engine.snapshot()
    assert isinstance(snapshot["orders"], list)

    # Simulate feed disconnect by forcing stale timestamp.
    engine.portfolio.last_feed_ts = engine.portfolio.last_feed_ts.replace(year=2000)
    guards = engine.risk.evaluate(engine.portfolio)
    assert guards.stale_feed is True
