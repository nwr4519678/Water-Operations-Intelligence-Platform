# Backend architecture

The backend is a modular monolith with explicit dependency inversion. The runtime composition is:

```text
                 ┌──────────────┐
                 │ API          │  HTTP, auth, middleware, composition root
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │ Application  │  features, use cases, DTOs, ports
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │ Domain       │  entities and business invariants
                 └──────────────┘

                 ┌──────────────┐
                 │ Infrastructure│ EF Core, databases, caches, jobs, clients
                 └──────┬───────┘
                        └──────► Application / Domain abstractions
```

## Project responsibilities

- `WaterOperations.Domain`: framework-independent entities, value objects, domain rules, and domain exceptions.
- `WaterOperations.Application`: feature use cases, commands, queries, DTOs, validation, mapping, and ports.
- `WaterOperations.Infrastructure`: EF Core persistence, migrations, database configuration, caching, jobs, and concrete integrations.
- `WaterOperations.Api`: controllers, middleware, API envelopes, authentication/authorization configuration, and the composition root.

The API may reference Infrastructure for registration in `Program.cs`; application code and controllers must not depend on concrete Infrastructure services.

## Feature conventions

Features live under `Application/Features/<Capability>` and group code by use case:

```text
Viewer/
  Commands/<UseCase>/
  Queries/<UseCase>/
  DTOs/
  Interfaces/
  Validators/
```

Only create folders required by the feature. Commands express state-changing intent. Queries express reads and return Application-owned DTOs. Handlers coordinate one use case, preserve cancellation, and do not contain EF Core or external-service implementations.

## Boundary rules

```text
Domain -> Infrastructure/API       ❌
Domain -> EF Core/ASP.NET          ❌
Application -> Infrastructure/API ❌
Application -> EF Core/Redis       ❌
Infrastructure -> Application     ✅
Infrastructure -> Domain           ✅
API -> Application                 ✅
API -> Infrastructure              ✅ only for composition
```

API models, Application DTOs, Domain entities, and persistence models are separate contracts. Mapping belongs at the boundary that owns the source or destination; simple read projections may remain in the Infrastructure query adapter when they produce Application DTOs directly.

## Adding a new infrastructure service

Define a narrow port in Application when a use case requires a database, cache, file store, message bus, or external API. Implement it in Infrastructure, register it in `AddInfrastructure`, and inject the port into the Application handler. Do not expose provider-specific options or types in Application contracts.

## Local development and migrations

Set `ConnectionStrings__Default` and approved CORS origins through environment-specific configuration. Migrations live in `backend/src/WaterOperations.Infrastructure/Persistence/Migrations` and are created/applied with the Infrastructure project and API startup project. Development seeding is enabled only by `Seed__Enabled=true` in the Development environment.

## Verification and contributor checklist

Before submitting a backend change:

- Run `dotnet build WaterOperations.slnx --configuration Release --warnaserror`.
- Run `dotnet test WaterOperations.slnx --configuration Release`.
- Run `dotnet format WaterOperations.slnx --verify-no-changes` when formatting is relevant.
- Review project references and confirm no Domain/Application dependency points upward.
- Confirm controllers contain no database or business logic.
- Confirm no secrets, local paths, generated output, or unrelated formatting changes are included.
- Add or update tests for changed use cases and contracts.
