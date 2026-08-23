# AI service

Optional FastAPI service for intelligence workloads. It is independently deployable and unavailable-safe: the core telemetry viewer does not require it to be online.

```mermaid
flowchart LR
  Client[Platform API / frontend] --> Contract[AI HTTP contract]
  Contract --> FastAPI[FastAPI application]
  FastAPI --> Model[Inference adapter]
  FastAPI --> Features[(Prepared features)]
  FastAPI --> Health[/health]
  Failure[AI unavailable] -. graceful degradation .-> Client
```

The `app` directory contains routes, schemas, services, and configuration; `tests` contains service and contract tests. Run locally with `python -m pip install -r requirements.txt` followed by `python -m uvicorn app.main:app --reload --port 8000`. Run `pytest` for verification. Keep model credentials outside the repository and define timeouts/fallback behavior for every caller.
