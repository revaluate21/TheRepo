"""Single-entry launcher: `python run_app.py`.

Safe default is deterministic simulation mode.
"""

from app.cli import app

if __name__ == "__main__":
    app()
