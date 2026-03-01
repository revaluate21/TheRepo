from __future__ import annotations

from collections.abc import Iterator
from app.storage.journal import Journal


class ReplayTool:
    def __init__(self, journal: Journal):
        self.journal = journal

    def events(self) -> Iterator[dict]:
        for evt in self.journal.read_all():
            yield evt
