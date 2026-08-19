# Backend architecture

The backend is a .NET 10 modular monolith using pragmatic Clean Architecture:

```text
API -> Application -> Domain
Infrastructure -> Application + Domain
```

The API is the composition root and owns HTTP concerns. Application owns use cases, feature contracts, DTOs, validation, and ports. Domain owns business rules and entities without framework or persistence dependencies. Infrastructure implements technical concerns such as EF Core, PostgreSQL, Redis, Hangfire, and external integrations.

## Feature organization

Business capabilities are organized by feature first:

```text
Application/Features/Viewer/
  DTOs/         Application-owned response contracts
  Interfaces/   Ports implemented by Infrastructure
  Queries/      MediatR requests and handlers for read use cases
```

Create `Commands` for state-changing intent and `Queries` for reads. A handler coordinates one use case, passes cancellation through, and depends only on Application or Domain contracts. It must not access `DbContext`, Redis, an HTTP client, or an Infrastructure class directly.

API request models and response envelopes belong to API. Application DTOs describe use-case data. Domain entities are never returned from controllers, and Infrastructure persistence entities must not cross the Application boundary.

## Dependency rules

```text
Domain -> Infrastructure/API       forbidden
Application -> Infrastructure/API forbidden
Infrastructure -> Application     allowed
Infrastructure -> Domain           allowed
API -> Application                 allowed
API -> Infrastructure              composition/registration only
```

Architecture tests enforce the most important rules and verify that Viewer contracts do not expose Domain entities. Keep technical implementations in Infrastructure and keep controllers limited to route binding, query dispatch, cancellation, and HTTP response translation.

## Adding a feature

1. Identify the use case and classify it as a command or query.
2. Create a feature folder under `Application/Features`.
3. Add the request, Application DTO/result, handler, and validator when needed.
4. Define an Application port only when the use case needs persistence or an external capability.
5. Implement that port in Infrastructure and register it in `AddInfrastructure`.
6. Add a thin API endpoint and map only HTTP concerns.
7. Add unit, integration, and architecture coverage appropriate to the behavior.

Avoid generic repositories, empty abstractions, and technical wrappers that do not protect a boundary.

## Local development and database

From the repository root, configure `ConnectionStrings__Default`, then run:

```powershell
dotnet restore WaterOperations.slnx
dotnet ef database update --project backend/src/WaterOperations.Infrastructure --startup-project backend/src/WaterOperations.Api
dotnet run --project backend/src/WaterOperations.Api
```

Development seed execution is restricted to Development and requires `Seed__Enabled=true`. It is deterministic and idempotent. Configure browser origins with `Cors__AllowedOrigins__0` and additional indexed values as needed. Production credentials must come from environment or deployment configuration.

## Verification

```powershell
dotnet build WaterOperations.slnx --configuration Release --warnaserror
dotnet test WaterOperations.slnx --configuration Release
dotnet format WaterOperations.slnx --verify-no-changes
```

The test projects are separated into Unit, Integration, and Architecture suites. Add a regression test whenever a feature changes an endpoint contract, boundary, or important business rule.
Infrastructure implements `IRepository<TEntity>` and `IUnitOfWork` with EF Core in `Infrastructure/Persistence`. Controllers never access EF Core directly.

The Viewer foundation uses PostgreSQL-compatible EF Core persistence and stores migrations in `Infrastructure/Persistence/Migrations`. Set `ConnectionStrings__Default` before running `dotnet ef database update`. Local seed execution is controlled by `Seed__Enabled=true` and is restricted to the Development environment. The API requires `Cors__AllowedOrigins__0` (and additional indexed values as needed) for browser access.
