# Database

Database initialization scripts, extensions, migrations support, seed policies, and operational database notes belong here.

## PostgreSQL bootstrap

The project uses PostgreSQL/TimescaleDB exclusively. The canonical schema is produced by the EF Core PostgreSQL migration and exported to [WaterOperations.PostgreSql.sql](./WaterOperations.PostgreSql.sql).

For existing environments, apply versioned EF migrations. For a new environment, start PostgreSQL/TimescaleDB using the repository Docker Compose configuration, then apply the migration or the generated PostgreSQL script.

The `AddTimescalePolicies` migration uses `Telemetry.MeasurementRaw.DeviceTimestampUtc`
and `Telemetry.MeasurementClean.TimestampUtc` as the time dimensions. On TimescaleDB it
creates hypertables and applies conservative 90-day raw and 365-day clean retention policies.
On PostgreSQL without TimescaleDB the migration intentionally leaves ordinary PostgreSQL
tables intact; deployments that require retention must enable TimescaleDB before migration.
