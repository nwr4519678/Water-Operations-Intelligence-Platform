# Backend architecture

The backend is a .NET 10 modular monolith with explicit Clean Architecture boundaries.

```text
Api -> Application -> Domain
Infrastructure -> Application + Domain
Worker -> Application + Infrastructure
```

`Application/Common` contains cross-cutting use-case infrastructure, while `Application/Features` is reserved for vertical slices and intentionally empty in the foundation. The ASP.NET Core Web API uses `Api/Controllers` as its HTTP transport boundary. Infrastructure is organized by capability, so database persistence, caching, jobs, authentication, and integrations do not become one large folder.

Application cross-cutting responsibilities are organized as follows:

- `Common/Mapping` — AutoMapper profiles and mapping conventions.
- `Common/Validation` and `Common/Behaviors` — FluentValidation registration, validators, and MediatR validation pipeline behavior.
- `Common/Abstractions` — repository, read-repository, unit-of-work, messaging, cache, and other ports.
- `Features/<Capability>` — feature-specific DTOs, commands, queries, handlers, validators, and mapping profiles.

Infrastructure implements `IRepository<TEntity>` and `IUnitOfWork` with EF Core in `Infrastructure/Persistence`. Controllers never access EF Core directly.

The Viewer foundation uses PostgreSQL-compatible EF Core persistence and stores migrations in `Infrastructure/Persistence/Migrations`. Set `ConnectionStrings__Default` before running `dotnet ef database update`. Local seed execution is controlled by `Seed__Enabled=true` and is restricted to the Development environment. The API requires `Cors__AllowedOrigins__0` (and additional indexed values as needed) for browser access.
