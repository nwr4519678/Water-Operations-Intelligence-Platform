# Docker

Local container orchestration and Docker build assets belong here. Run the repository-level `docker-compose.yml` for the standard developer entry point.

The required local services are PostgreSQL/TimescaleDB and Redis. The AI service is behind the `ai` Compose profile because it is optional for the core telemetry viewer path. All ports and database values can be overridden through the repository `.env` file.
