# Water Operations Intelligence Platform — Clean Architecture Refactor Plan

This plan adapts the attached generic Clean Architecture prompt to the current project. It is intentionally incremental: existing API routes, PostgreSQL table names, migrations, and business behavior remain compatible unless a change is required to fix a verified defect.

## Current architecture assessment

### Solution layout

```text
backend/
├── src/
│   ├── WaterOperations.Domain/
│   ├── WaterOperations.Application/
│   ├── WaterOperations.Infrastructure/
│   ├── WaterOperations.Api/
│   └── WaterOperations.slnx
└── tests/
    ├── WaterOperations.ArchitectureTests/
    ├── WaterOperations.UnitTests/
    └── WaterOperations.IntegrationTests/
```

The four-project split already matches the intended dependency direction:

```text
Api → Application → Domain
Api → Infrastructure → Application → Domain
```

The API is the composition root and Infrastructure implements persistence, Hangfire, Redis, security stores, and viewer reads. Application already contains MediatR queries, DTOs, mapping, validation behavior, and persistence abstractions.

### Strengths to preserve

- Domain has no project reference to EF Core or ASP.NET Core.
- PostgreSQL/Npgsql migrations and reporting views are isolated in Infrastructure.
- API authentication, middleware, health checks, SignalR, and controllers are separated by concern.
- Existing viewer reads use an Application interface and an Infrastructure EF implementation.
- Architecture, unit, and integration test projects already exist.

### Current debt and boundary violations

- Several newer API controllers query `WaterOperationsDbContext` directly. This is expedient but violates the desired API → Application use-case boundary.
- The generated EF entity model is intentionally anemic and lives in Domain. It is currently provider-neutral enough to compile without EF, but moving every generated type immediately would create migration and behavior risk.
- `ViewerUserStore` and the test-only `TelemetryStore` are legacy compatibility paths. Production telemetry now uses PostgreSQL, but test fixtures still exercise the in-memory store.
- Authentication configuration is read directly in Program/AuthTokenService and the development viewer path is not a complete production identity implementation.
- Outbox, ingestion, retention, and MFA code paths need application commands, explicit authorization policies, and integration coverage before they can be considered production-complete.
- `Program.cs` still contains a large amount of composition and startup behavior that should move into API extension methods.

## Project-specific target architecture

Keep the current four projects. Add structure only when a real feature requires it:

```text
Domain
  Entities, value objects, domain events, invariants, domain exceptions

Application
  Abstractions/{Persistence,Identity,Messaging,Services}
  Features/{Auth,Telemetry,Stations,Ingestion,Governance,Jobs}
  DTOs, validators, MediatR handlers, behaviors

Infrastructure
  Persistence/{Context,Configurations,Repositories,Migrations,Seed}
  Identity, Messaging, BackgroundJobs, Caching, ExternalServices

Api
  Controllers, Hubs, Middleware, Contracts, Extensions, Program
```

### Rules for this repository

1. API controllers translate HTTP to Application requests; they do not own business rules or EF queries.
2. Application depends on abstractions, not Infrastructure implementations or `HttpContext`.
3. Infrastructure owns EF Core, PostgreSQL, Redis, Hangfire, cryptography persistence, and external clients.
4. Domain remains independent of ASP.NET Core, EF Core, SQL, configuration, and logging.
5. Existing routes and response compatibility are preserved while endpoints are moved behind handlers.
6. `DbContext.SaveChangesAsync` remains the transaction boundary unless a use case needs an explicit transaction.
7. Do not introduce generic repositories, factories, wrappers, or CQRS handlers without a meaningful boundary.
8. Generated EF entities and migrations are changed only through a controlled migration step.

## Phased implementation plan

### Phase 1 — Baseline and boundaries

- Keep the moved `backend/src/WaterOperations.slnx` paths valid.
- Add architecture tests for project dependency direction.
- Add `ICurrentUser`/tenant abstractions in Application and an API adapter.
- Move shared API contracts out of controllers where they are reused by REST and SignalR.
- Extract API service registration and middleware setup from Program.cs.

### Phase 2 — Core read use cases

- Move overview, stations, telemetry, chart, and data-quality queries into Application features.
- Keep projections in Infrastructure implementations or query services.
- Preserve pagination, UTC handling, tenant filters, and response shapes.
- Add API contract and cross-tenant integration coverage.

### Phase 3 — Stateful commands and messaging

- Move ingestion, raw-to-clean publishing, alarm mutations, MFA, and retention operations into Application commands.
- Define an application outbox abstraction; keep the EF outbox implementation in Infrastructure.
- Publish SignalR events only from committed outbox messages.
- Keep Hangfire jobs thin and invoke Application commands/services.

### Phase 4 — Identity and security

- Replace production development-viewer login with database-backed users, roles, password hashing, sessions, MFA, lockout, and recovery flows.
- Centralize strongly typed JWT/security options.
- Define explicit permission policies and tenant-scope checks.
- Redact secrets and sensitive tenant data from logs and errors.

### Phase 5 — Persistence hardening

- Move new EF configuration into `IEntityTypeConfiguration<T>` classes incrementally.
- Preserve existing generated migrations and table names.
- Add constraints, indexes, outbox/MFA migrations, concurrency behavior, and migration-lock/runbook evidence.
- Keep TimescaleDB behavior documented and environment-gated.

### Phase 6 — Verification and cleanup

- Run `dotnet format --verify-no-changes` where supported.
- Run solution build and all tests from `backend/src/WaterOperations.slnx`.
- Run `dotnet ef migrations has-pending-model-changes`.
- Run architecture tests and security/tenant integration tests.
- Remove only verified dead code and obsolete compatibility paths.
- Record remaining technical debt and any intentional compatibility shims.

## Risk controls

- No mass rewrite of generated entities.
- No destructive migration or table rename.
- No route or response breaking change without an explicit compatibility decision.
- Every schema change gets a migration and pending-model audit.
- Every controller extraction preserves cancellation-token propagation and authorization behavior.
- Compatibility-only test fixtures are clearly marked and never registered in production.

## Definition of done

- The solution builds from `backend/src/WaterOperations.slnx`.
- All existing tests pass and new boundary/security tests cover changed behavior.
- Domain and Application dependency rules are enforced by architecture tests.
- API controllers are thin for migrated features.
- PostgreSQL migrations are current with no pending model changes.
- Authentication, tenant scope, outbox delivery, jobs, and retention operations have explicit failure and audit behavior.
- Remaining technical debt is documented rather than hidden.

## Implementation status — 2026-08-22

Completed in this iteration:

- Repaired the moved solution file so `backend/src/WaterOperations.slnx` resolves projects from its new location.
- Added the Application-layer `ICurrentUser` abstraction and API `HttpCurrentUser` adapter; controllers no longer need to parse tenant claims for migrated features.
- Extracted station search/detail EF projections into the Infrastructure `IStationReadService` implementation and reduced `StationsController` to HTTP translation and authorization decisions.
- Extracted operations overview/data-quality, telemetry/chart reads, ingestion, clean-pipeline publishing, retention/audit purge, and MFA persistence/cryptography into Application interfaces with Infrastructure implementations.
- Updated the telemetry SignalR hub to use the Application station-read boundary for station authorization; the hub retains only group membership and transport concerns.
- Registered the new abstractions through the existing Application/Infrastructure composition root without changing routes, schema, or migrations.
- Preserved the testing-only legacy telemetry fixture as an explicitly documented API compatibility shim.
- Added an architecture guard that rejects EF `DbContext` constructor dependencies in API controllers.
- Verified solution build and all 14 tests after the final extraction batch.

Remaining technical debt / follow-up:

- Add dedicated contract and tenant-boundary tests for ingestion, pipeline, retention, and MFA; the existing architecture, unit, and integration suites remain green.
- Review generated-migration analyzer warnings separately; generated migration files were intentionally not rewritten.
- The testing-only telemetry fixture and raw SignalR claim strings are intentional compatibility shims and should be removed only after the development viewer contract is retired.

Verification from the moved solution:

```text
dotnet build WaterOperations.slnx --no-restore       passed (0 errors)
dotnet test WaterOperations.slnx --no-restore        passed (14 tests)
dotnet ef migrations has-pending-model-changes       no pending model changes
```

The scoped formatting verification for the refactored files passes. A whole-solution `dotnet format --verify-no-changes` still reports legacy encoding/whitespace findings in untouched generated and pre-existing files; those were not mass-rewritten to avoid unrelated churn.
