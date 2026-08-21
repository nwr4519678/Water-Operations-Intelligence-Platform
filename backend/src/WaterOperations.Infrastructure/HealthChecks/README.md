# Health checks

Readiness and liveness checks for PostgreSQL, Redis, Hangfire, and downstream services belong here.

The API exposes `/health/live` for process liveness and `/health/ready` for PostgreSQL and Redis readiness. Keep dependency checks here so the API composition root remains responsible only for wiring and endpoint mapping.
