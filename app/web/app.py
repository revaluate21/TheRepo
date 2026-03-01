from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Form
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.core.config import Settings
from app.services.engine import Engine
from app.storage.replay import ReplayTool


class AppState:
    engine: Engine
    engine_task: asyncio.Task | None = None


def create_app(settings: Settings) -> FastAPI:
    state = AppState()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        state.engine = Engine(settings)
        state.engine_task = asyncio.create_task(state.engine.start())
        try:
            yield
        finally:
            state.engine.stop()
            if state.engine_task:
                state.engine_task.cancel()

    app = FastAPI(lifespan=lifespan, title="Prediction Research & Execution Suite")
    templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
    app.mount("/static", StaticFiles(directory=str(Path(__file__).parent / "static")), name="static")

    @app.get("/", response_class=HTMLResponse)
    async def index(request: Request):
        return templates.TemplateResponse("index.html", {"request": request, "snapshot": state.engine.snapshot(), "confirm_phrase": settings.live_confirm_phrase})

    @app.get("/api/snapshot")
    async def snapshot():
        return JSONResponse(state.engine.snapshot())

    @app.post("/api/toggle")
    async def toggle(strategy: str = Form(...), enabled: str = Form("false")):
        state.engine.set_toggle(strategy, enabled.lower() == "true")
        return PlainTextResponse("ok")

    @app.get("/api/journal.csv")
    async def journal_csv():
        events = state.engine.journal.read_all()
        header = "ts,type,payload\n"
        lines = [f'{e["ts"]},{e["type"]},"{str(e["payload"]).replace(chr(34), chr(39))}"' for e in events]
        return PlainTextResponse(header + "\n".join(lines), media_type="text/csv")

    @app.get("/api/replay")
    async def replay():
        replay_tool = ReplayTool(state.engine.journal)
        return JSONResponse({"events": list(replay_tool.events())[-100:]})

    @app.websocket("/ws")
    async def ws_stream(websocket: WebSocket):
        await websocket.accept()
        try:
            while True:
                event = await state.engine.events.get()
                await websocket.send_json({"event": event, "snapshot": state.engine.snapshot()})
        except WebSocketDisconnect:
            return

    return app
