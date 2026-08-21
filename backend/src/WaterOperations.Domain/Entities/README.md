# Domain entity organization

The entity files are grouped by the PostgreSQL schema they belong to:

- `AI`: anomaly events, model registry, training runs, clusters, focus scores, and risk scores.
- `Core`: organizations' regions, stations, topology, parameters, station parameters, and thresholds.
- `Operations`: alarms, annotations, notifications, and collaboration notes.
- `Platform`: organizations, settings, dashboard layouts, and share snapshots.
- `Reporting`: reports and report schedules.
- `Security`: users, roles, permissions, sessions, and audit logs.
- `Telemetry`: raw/clean measurements, ingestion batches, feature sets, feature store, and data quality.
- `Views`: keyless read models mapped to `Reporting` PostgreSQL views.
- `Functions`: result models for PostgreSQL functions.
- `ProcedureResults`: result models for database command/query results.

All files intentionally keep the shared `WaterOperations.Domain.Entities` namespace so moving files does not change the public domain contract. `WaterOperationsDbContext` remains in Infrastructure and maps each entity to its schema explicitly.
