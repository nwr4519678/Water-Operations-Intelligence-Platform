# Database operations

PostgreSQL/TimescaleDB is the system of record for operational and time-series data. EF Core migrations are owned by `WaterOperations.Infrastructure`; backup, restore, and release migration wrappers live beside this README.

```mermaid
flowchart TB
  Change[Schema change] --> Migration[EF migration]
  Migration --> Backup[Pre-migration backup]
  Backup --> Apply[Apply migration]
  Apply --> Verify[Readiness + release smoke]
  Verify -->|pass| Promote[Promote release]
  Verify -->|fail| Restore[Restore backup / rollback]
```

Use `release-migration.ps1` for governed releases, `backup.ps1` before destructive maintenance, and `restore.ps1` only with an explicitly supplied restore connection. Never commit database credentials or generated local dumps.
