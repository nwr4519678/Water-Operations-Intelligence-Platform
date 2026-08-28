# Supabase production database

The backend uses the environment variable `ConnectionStrings__Default`. The
connection string is intentionally not stored in `appsettings.json` or source
control.

For local execution, copy `.env.example` to `.env` and set:

```text
ConnectionStrings__Default=Host=<pooler-host>;Port=5432;Database=postgres;Username=<pooler-user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

For Docker Compose, Compose reads the root `.env` file and passes the value to
the API container. In a hosted deployment, configure the same variable in the
platform's secret manager instead of uploading `.env`.

On startup, non-test environments call `Database.MigrateAsync`. The migration
`20260828220000_AddDahitiObservations` creates the DAHITI tables, indexes, view,
and read policies idempotently. The production database currently contains 19
stations and 4,050 source observations.

Never expose the database connection string, Supabase service-role key, or
DAHITI API key to the frontend. The password supplied during setup should be
rotated after deployment because it has been shared in a chat message.
