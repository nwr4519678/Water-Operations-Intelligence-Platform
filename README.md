# Water Operations Intelligence Platform

Foundation for a real-time water telemetry and operations intelligence platform.

## Stack

- ASP.NET Core 10 / C# / Clean Architecture
- React 19 / TypeScript / Vite / TanStack Query
- PostgreSQL with TimescaleDB and Redis
- Python 3.12 / FastAPI AI service
- Hangfire for durable background jobs
- Scalar OpenAPI reference for the API

## Run locally

### Prerequisites

- Docker Desktop with Compose v2.
- .NET 10 SDK.
- Node.js 20 or newer.
- Python 3.12 only when running the AI service outside Docker.

### Quick start

1. Copy `.env.example` to `.env`. The committed example contains local development values only; never put real credentials in either file.
2. Run the bootstrap command from the repository root:

   ```powershell
   .\scripts\dev.ps1
   ```

   On macOS/Linux, use `./scripts/dev.sh`. Add `-WithAi` or `--with-ai` to start the optional AI container.
3. In a second terminal, start the API:

   ```powershell
   dotnet run --project backend/src/WaterOperations.Api --launch-profile http
   ```

4. In a third terminal, install and start the viewer shell:

   ```powershell
   npm --prefix frontend install
   npm --prefix frontend run dev
   ```

The normal local URLs are the frontend at `http://localhost:5173`, API at `http://localhost:5102`, API liveness at `/health/live`, API readiness at `/health/ready`, Scalar at `/scalar`, and the optional AI service at `http://localhost:8000/health`.

Startup order is: PostgreSQL/TimescaleDB and Redis, database migrations/seed when they are introduced, API, optional AI service, then React. The current Phase 0 foundation has no migrations or seed data yet, so the migration step is intentionally a no-op.

### Configuration

The API reads standard ASP.NET Core environment variables. `.env.example` documents the supported local values, including `ConnectionStrings__Default`, `ConnectionStrings__Redis`, `Cors__AllowedOrigins__0`, `VITE_API_BASE_URL`, and `AI_SERVICE_URL`. CORS is restricted to the local viewer origin by default.

### Troubleshooting

- **Docker is unavailable:** start Docker Desktop, then rerun `docker compose up -d postgres redis`.
- **Port already in use:** change `POSTGRES_PORT`, `REDIS_PORT`, or `AI_SERVICE_PORT` in `.env`; update the matching connection string and service URL as well.
- **API fails on startup:** confirm `.env` was copied and that `ConnectionStrings__Default` and `ConnectionStrings__Redis` are exported in the API terminal. The API fails fast when either value is missing.
- **`/health/ready` is unhealthy:** run `docker compose ps` and `docker compose logs postgres redis`; both required services must report healthy before the API is ready.
- **Frontend cannot call the API:** verify the API is running on port 5102 and that `Cors__AllowedOrigins__0` matches the browser origin exactly.
- **AI features are unavailable:** AI is optional. Start it with `docker compose --profile ai up -d --build ai-service`, or run `python -m uvicorn app.main:app --app-dir ai-service --reload --port 8000`.
- **Login/overview is not available yet:** the repository currently contains the viewer shell and platform foundation; product feature modules are added behind the Application CQRS boundaries.

## Local viewer authentication

The API exposes `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, and authenticated `POST /api/v1/auth/logout`. Configure `DevelopmentViewer__Email` and `DevelopmentViewer__Password` through local environment variables; do not commit values. Optional `DevelopmentViewer__Organization` and `DevelopmentViewer__Region` define the viewer scope. These settings are for local testing only.

## Architecture structure

```text
backend/
  src/
    WaterOperations.Api/             # ASP.NET Core Web API controllers and composition root
    WaterOperations.Application/     # Common plus vertical feature slices
    WaterOperations.Domain/          # Pure business model and domain primitives
    WaterOperations.Infrastructure/  # EF Core, Redis, Hangfire, security, integrations
  tests/                              # Unit, integration, architecture, contract tests
frontend/src/                         # app, components, features, lib, services, types
ai-service/app/                       # Independent AI bounded component
data-engineering/                     # Independent ingestion and transformation workflows
  src/ pipelines/ tests/ configs/
infrastructure/                       # docker, deployment, database, monitoring
docs/                                  # architecture, api, development, deployment, adr
```

## Architecture rules

Domain contains business rules only. Application owns use cases, DTOs, validation, and interfaces. Features are vertical slices and own their internal contracts. Infrastructure owns EF Core, PostgreSQL, Redis, and Hangfire. API owns transport concerns and never accesses the database directly. The foundation intentionally contains no product feature implementation.
