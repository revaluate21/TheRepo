# Polymarket + Kalshi Research & Execution Suite

Local-first, simulation-default research and execution workstation with one-command startup.

## Safety Defaults
- Default mode is **simulation** and deterministic.
- Live mode requires `--live --confirm-live` and UI phrase acknowledgment.
- Dry run live mode (`--dry-run-live`) performs auth/sign flow but no order submission.
- No guaranteed profit claims; alerts and strategies are probabilistic.

## Quick start (Windows friendly)
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run_app.py serve
```
Then open http://127.0.0.1:8000

Or:
```bash
make run
```

## Project tree
```text
.
├── app
│   ├── cli.py
│   ├── connectors
│   │   ├── kalshi.py
│   │   ├── news.py
│   │   ├── polymarket.py
│   │   └── simulated.py
│   ├── core
│   │   ├── config.py
│   │   ├── models.py
│   │   └── state_machine.py
│   ├── risk
│   │   └── manager.py
│   ├── services
│   │   └── engine.py
│   ├── storage
│   │   ├── db.py
│   │   ├── journal.py
│   │   └── replay.py
│   ├── strategies
│   │   ├── convergence.py
│   │   ├── mispricing.py
│   │   ├── news_shock.py
│   │   └── spread_capture.py
│   └── web
│       ├── app.py
│       └── templates/index.html
├── tests
├── .env.example
├── Makefile
├── pyproject.toml
├── requirements.txt
└── run_app.py
```

## Tests
```bash
pytest -q
```

## Notes on integrations
- Polymarket integration uses `py-clob-client` APIs (EIP-712 signing, API creds, order post).
- Kalshi integration uses official public market data endpoint `/markets`.
- X ingestion uses official API only when keys are set; otherwise RSS fallback.
