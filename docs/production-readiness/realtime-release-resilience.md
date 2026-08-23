# Real-time, release, and resilience verification

The production-readiness gate covers the non-HTTP paths as well as the API.

## Real-time contract

`TelemetryHub` is protected by the viewer policy. A SignalR client must connect to
`/hubs/telemetry`, call `Subscribe`, and receive only its organization/region
groups. `SubscribeToStation` must reject a station outside the current user's
organization or region. Any regression is a release blocker.

Run the application with test data and verify the contract with a SignalR client:

```powershell
dotnet test backend/src/WaterOperations.slnx --configuration Release
```

## Release smoke and performance

After deployment, run:

```powershell
./scripts/release-smoke.ps1 -BaseUrl https://api.example.com
./scripts/api-performance-baseline.ps1 -BaseUrl https://api.example.com -Requests 500
```

The smoke gate checks liveness, readiness, Swagger availability, and metrics
authorization. The performance baseline records average, p95, and maximum
latency for the live endpoint.

## Failure injection

Failure injection is intentionally explicit and does not stop production
services automatically:

```powershell
./scripts/failure-injection-check.ps1 -UnavailableUrl http://127.0.0.1:1
```

Use a staging deployment to stop Redis or PostgreSQL, verify readiness fails,
restore the dependency, and rerun `release-smoke.ps1`. Record the result with
the release evidence.
