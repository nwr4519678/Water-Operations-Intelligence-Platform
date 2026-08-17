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

1. Start infrastructure: `docker compose up -d`
2. Run the API: `dotnet run --project backend/src/WaterOperations.Api`
3. Open Scalar: `https://localhost:5001/scalar` (port may vary by launch profile).
4. Run the frontend: `cd frontend; npm install; npm run dev`
5. Run the AI service: `python -m uvicorn app.main:app --app-dir ai-service --reload --port 8000`

The current implementation is the Phase 0 foundation. Feature modules are added behind the Application CQRS boundaries.

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
