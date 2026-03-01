from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import json


class Journal:
    def __init__(self, path: str):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def append(self, event_type: str, payload: dict) -> None:
        row = {"ts": datetime.now(timezone.utc).isoformat(), "type": event_type, "payload": payload}
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, default=str) + "\n")

    def read_all(self) -> list[dict]:
        if not self.path.exists():
            return []
        with self.path.open("r", encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]
