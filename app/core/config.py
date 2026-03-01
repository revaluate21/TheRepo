from __future__ import annotations

from dataclasses import dataclass, field
import os


@dataclass
class RiskConfig:
    max_position_usd: float = 250
    max_daily_loss_usd: float = 100
    max_drawdown_pct: float = 15
    max_latency_ms: int = 1200
    max_stale_seconds: int = 15


@dataclass
class Settings:
    mode: str = "simulation"
    host: str = "127.0.0.1"
    port: int = 8000
    db_path: str = "./data/suite.db"
    journal_path: str = "./data/journal.jsonl"
    sim_seed: int = 42
    sim_speed: float = 1.0
    live_confirm_phrase: str = "I UNDERSTAND I CAN LOSE EVERYTHING"
    polymarket_host: str = "https://clob.polymarket.com"
    polymarket_chain_id: int = 137
    polymarket_private_key: str | None = None
    polymarket_proxy_address: str | None = None
    polymarket_funder: str | None = None
    kalshi_api_base: str = "https://api.elections.kalshi.com/trade-api/v2"
    rss_feeds: str = ""
    x_bearer_token: str | None = None
    x_api_key: str | None = None
    x_api_secret: str | None = None
    x_access_token: str | None = None
    x_access_token_secret: str | None = None
    risk: RiskConfig = field(default_factory=RiskConfig)


def load_settings() -> Settings:
    return Settings(
        mode=os.getenv("APP_MODE", "simulation"),
        host=os.getenv("APP_HOST", "127.0.0.1"),
        port=int(os.getenv("APP_PORT", "8000")),
        db_path=os.getenv("DB_PATH", "./data/suite.db"),
        journal_path=os.getenv("JOURNAL_PATH", "./data/journal.jsonl"),
        sim_seed=int(os.getenv("SIM_SEED", "42")),
        sim_speed=float(os.getenv("SIM_SPEED", "1.0")),
        live_confirm_phrase=os.getenv("LIVE_CONFIRM_PHRASE", "I UNDERSTAND I CAN LOSE EVERYTHING"),
        polymarket_host=os.getenv("POLYMARKET_HOST", "https://clob.polymarket.com"),
        polymarket_chain_id=int(os.getenv("POLYMARKET_CHAIN_ID", "137")),
        polymarket_private_key=os.getenv("POLYMARKET_PRIVATE_KEY"),
        polymarket_proxy_address=os.getenv("POLYMARKET_PROXY_ADDRESS"),
        polymarket_funder=os.getenv("POLYMARKET_FUNDER"),
        kalshi_api_base=os.getenv("KALSHI_API_BASE", "https://api.elections.kalshi.com/trade-api/v2"),
        rss_feeds=os.getenv("RSS_FEEDS", ""),
        x_bearer_token=os.getenv("X_BEARER_TOKEN"),
        x_api_key=os.getenv("X_API_KEY"),
        x_api_secret=os.getenv("X_API_SECRET"),
        x_access_token=os.getenv("X_ACCESS_TOKEN"),
        x_access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET"),
        risk=RiskConfig(
            max_position_usd=float(os.getenv("MAX_POSITION_USD", "250")),
            max_daily_loss_usd=float(os.getenv("MAX_DAILY_LOSS_USD", "100")),
            max_drawdown_pct=float(os.getenv("MAX_DRAWDOWN_PCT", "15")),
            max_latency_ms=int(os.getenv("MAX_LATENCY_MS", "1200")),
            max_stale_seconds=int(os.getenv("MAX_STALE_SECONDS", "15")),
        ),
    )
