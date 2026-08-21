# Persistence

Persistence is organized by responsibility:

- `Context/`: `WaterOperationsDbContext` and EF Core model configuration.
- `Migrations/`: PostgreSQL schema migrations and model snapshot.
- `Repositories/`: EF Core repository implementations.

Runtime persistence is PostgreSQL-only. The infrastructure composition root creates one
pooled `NpgsqlDataSource` from `ConnectionStrings:Default` and supplies it to EF Core;
the same canonical connection string is used by Hangfire. Tests explicitly use the EF Core
InMemory provider and never affect the production registration.

Production startup applies migrations through `IPostgreSqlMigrationRunner`, which takes a
PostgreSQL session advisory lock before running the ordered chain. This prevents multiple
API replicas from racing migrations. If a migration fails, startup fails and the lock is
released; operators should fix the migration or restore the previous application version
before retrying.

The generated model is extended by `WaterOperationsDbContext.PostgreSqlConfiguration.cs`:
JSON documents use PostgreSQL `jsonb`, UTC values use `timestamp with time zone`, and user
concurrency uses an explicit `bytea` token rather than SQL Server `rowversion` semantics.

Apply the checked-in migrations with:

```powershell
dotnet ef database update --project backend/src/WaterOperations.Infrastructure --startup-project backend/src/WaterOperations.Api
```

For rollback, deploy the previous application version and revert the database with an
explicit, reviewed migration target. Do not use `EnsureCreated` against a production
database, because it bypasses the migration history and rollback contract.

The DbContext keeps the shared `WaterOperations.Domain.Entities` namespace contract, while
the physical folders separate database access concerns from domain entities.
