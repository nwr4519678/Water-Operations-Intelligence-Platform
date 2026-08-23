# Release governance

Releases are versioned from `VersionPrefix` and promoted through the protected
GitHub environments `staging` and `production`.

The release workflow requires the complete CI suite and production-readiness
static gate before staging. Production is a separate protected-environment job,
so approval and deployment credentials remain outside the repository.

## Migration and rollback

Run the migration wrapper with a secret supplied by the deployment environment:

```powershell
./infrastructure/database/release-migration.ps1 `
  -ConnectionString $env:ConnectionStrings__Default
```

The wrapper takes a backup before applying migrations. If migration or readiness
verification fails, stop promotion, restore the backup with `restore.ps1`, and
rerun the release smoke checks before retrying.

## Compatibility

API routes remain under `/api/v1`. New contracts must be additive within a
version; breaking changes require a new API version and a documented migration
window. Production deployment uses rolling updates with zero planned
unavailable replicas and automatic rollback enabled.
