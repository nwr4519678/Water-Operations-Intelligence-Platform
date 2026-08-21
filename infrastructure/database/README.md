# Database

Database initialization scripts, extensions, migrations support, seed policies, and operational database notes belong here.

## PostgreSQL bootstrap

The project uses PostgreSQL/TimescaleDB exclusively. The canonical schema is produced by the EF Core PostgreSQL migration and exported to [WaterOperations.PostgreSql.sql](./WaterOperations.PostgreSql.sql).

For existing environments, apply versioned EF migrations. For a new environment, start PostgreSQL/TimescaleDB using the repository Docker Compose configuration, then apply the migration or the generated PostgreSQL script.
