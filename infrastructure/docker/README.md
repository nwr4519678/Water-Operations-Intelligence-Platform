# Docker runtime

The repository-level Compose file includes the canonical Docker configuration. PostgreSQL/TimescaleDB and Redis are required for the API; the AI service is optional behind the AI profile.

```mermaid
flowchart TB
  Compose[Docker Compose] --> PG[(PostgreSQL)]
  Compose --> Redis[(Redis)]
  PG --> API[API container]
  Redis --> API
  Compose -. profile ai .-> AI[AI container]
  API --> Live[/health/live]
```

Set `ConnectionStrings__Default` and `Authentication__SigningKey` through `.env` locally or deployment secrets. The API waits for healthy required dependencies and exposes `/health/live` for liveness.
