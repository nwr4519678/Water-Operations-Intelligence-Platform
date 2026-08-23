# Docker

Local container orchestration and Docker build assets belong here. Run the repository-level
docker-compose.yml for the standard developer entry point.

The required local services are PostgreSQL/TimescaleDB and Redis. The optional AI service
is behind the AI Compose profile because it is not required for the core telemetry viewer
path. All ports and database values can be overridden through the repository .env file.

The API container requires ConnectionStrings__Default and Authentication__SigningKey
in .env or the deployment secret store. Do not commit those values. The container
exposes /health/live for liveness and waits for healthy PostgreSQL and Redis dependencies.
