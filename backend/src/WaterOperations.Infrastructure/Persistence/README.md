# Persistence

Persistence is organized by responsibility:

- `Context/`: `WaterOperationsDbContext` and EF Core model configuration.
- `Migrations/`: PostgreSQL schema migrations and model snapshot.
- `Repositories/`: EF Core repository implementations.

The DbContext keeps the shared `WaterOperations.Domain.Entities` namespace contract, while
the physical folders separate database access concerns from domain entities.
