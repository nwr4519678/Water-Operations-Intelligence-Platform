# Backend

The backend is a .NET 10 modular monolith that owns HTTP transport, use cases, domain rules, persistence adapters, background jobs, security, and real-time telemetry delivery.

## Architecture

```mermaid
flowchart LR
  Api[WaterOperations.Api] --> App[WaterOperations.Application]
  App --> Domain[WaterOperations.Domain]
  Infra[WaterOperations.Infrastructure] --> App
  Infra --> Domain
  Infra --> PG[(PostgreSQL)]
  Infra --> Redis[(Redis)]
  Infra --> Jobs[Hangfire / Outbox]
  Api --> Hub[SignalR TelemetryHub]
```

Dependency direction: `Application -> Domain`, `Infrastructure -> Application + Domain`, and `API -> Application` (with Infrastructure referenced only for composition). Domain and Application never depend on API or Infrastructure.

## Source layout

```text
backend/
├── src/ WaterOperations.Api, Application, Domain, Infrastructure
└── tests/ UnitTests, IntegrationTests, ArchitectureTests
```

## Vertical feature convention

```text
Application/Features/<Feature>/
├── Commands/<UseCase>/   request, handler, validator
├── Queries/<UseCase>/    request, handler, validator
├── DTOs/                 application-owned contracts
├── Interfaces/           feature-specific repository ports
└── Mapping/              feature mapping profiles
```

```mermaid
flowchart TB
  Endpoint[Thin controller] --> Sender[ISender]
  Sender --> Validation[ValidationBehavior]
  Validation --> Authorization[AuthorizationBehavior]
  Authorization --> Handler[Focused handler]
  Handler --> Domain[Aggregate / domain behavior]
  Handler --> Port[Feature repository contract]
  Port --> Adapter[Infrastructure adapter]
  Adapter --> DB[(PostgreSQL)]
  Handler --> Result[Typed Result]
  Result --> Endpoint
```

Controllers do not calculate pagination, query databases, map persistence entities, define DTOs, or implement business rules.

## Local workflow

Run `dotnet restore backend/src/WaterOperations.slnx`, then `dotnet build backend/src/WaterOperations.slnx --configuration Release` and `dotnet test backend/src/WaterOperations.slnx --configuration Release`. For local persistence, start PostgreSQL and Redis, set `ConnectionStrings__Default` and `ConnectionStrings__Redis`, apply EF migrations, then run the API.

## Verification matrix

| Change | Evidence |
|---|---|
| Domain rule | Unit test and invariant review |
| Query/command | Unit test plus contract/integration coverage |
| Repository | PostgreSQL integration test |
| HTTP contract | Swagger contract test |
| Authorization | Positive and negative scope tests |
| Migration | Backup, migration, readiness, and rollback procedure |

See [architecture](../docs/architecture/README.md), [API](../docs/api/README.md), and [production readiness](../docs/production-readiness/testing-strategy.md).
