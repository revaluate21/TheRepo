from __future__ import annotations

import typer
import uvicorn

from app.core.config import load_settings
from app.core.models import Mode
from app.web.app import create_app

app = typer.Typer(add_completion=False)


@app.command()
def serve(
    live: bool = typer.Option(False, "--live", help="Enable live mode"),
    confirm_live: bool = typer.Option(False, "--confirm-live", help="Acknowledge live trading risk"),
    dry_run_live: bool = typer.Option(False, "--dry-run-live", help="Authenticate/sign but do not submit"),
):
    settings = load_settings()
    if live:
        if not confirm_live:
            raise typer.BadParameter("--live requires --confirm-live")
        settings.mode = Mode.LIVE.value
    elif dry_run_live:
        settings.mode = Mode.DRY_RUN_LIVE.value
    else:
        settings.mode = Mode.SIMULATION.value

    api = create_app(settings)
    uvicorn.run(api, host=settings.host, port=settings.port)


if __name__ == "__main__":
    app()
