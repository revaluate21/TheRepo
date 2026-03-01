from __future__ import annotations

from pathlib import Path
import sqlite3


SCHEMA = [
    """
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      venue TEXT,
      market_id TEXT,
      side TEXT,
      price REAL,
      quantity REAL,
      strategy TEXT,
      idempotency_key TEXT UNIQUE,
      venue_order_id TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS fills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      venue TEXT,
      fill_price REAL,
      fill_qty REAL,
      fee REAL,
      ts TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strategy TEXT,
      market_id TEXT,
      score REAL,
      reason TEXT,
      ts TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT,
      ts TEXT
    )
    """,
]


class Database:
    def __init__(self, db_path: str):
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.db_path = db_path

    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init(self) -> None:
        with self._connect() as conn:
            for stmt in SCHEMA:
                conn.execute(stmt)

    def execute(self, stmt: str, params: dict | None = None) -> None:
        with self._connect() as conn:
            conn.execute(stmt, params or {})
            conn.commit()

    def fetch_all(self, stmt: str, params: dict | None = None) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(stmt, params or {}).fetchall()
            return [dict(r) for r in rows]
