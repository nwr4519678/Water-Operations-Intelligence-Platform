# Observability, SLOs, backup, and disaster recovery

## Service objectives

| Indicator | Objective | Alert |
| --- | --- | --- |
| API availability | 99.9% monthly | 5xx > 1% for 5 minutes |
| API latency | p95 below 500 ms | p95 above 1 s for 10 minutes |
| Readiness | database and Redis healthy | any failed readiness check |
| Recovery point | RPO <= 15 minutes | backup older than 15 minutes |
| Recovery time | RTO <= 60 minutes | restore exercise exceeds 60 minutes |

The API exposes authenticated Prometheus text at /metrics, structured Serilog request
logs, X-Trace-Id correlation, and health endpoints:

- /health/live: process liveness;
- /health/ready: database and cache readiness;
- /health: combined diagnostic view.

## On-call response

1. Check /health/live and /health/ready.
2. Search logs by X-Trace-Id and inspect the 5xx and latency metrics.
3. Stop promotion if error budget burn is above the alert threshold.
4. Escalate database, cache, or AI dependency failures to the owning runbook.
5. Record incident timeline, impact, mitigation, and follow-up actions.

## Backup and restore exercise

Run the database backup job on the deployment platform using the secret-injected
connection string. Keep encrypted backups in a separate failure domain and retain them
according to the approved data-retention policy.

For every release train, restore the newest backup into an isolated PostgreSQL instance,
apply migrations, run the smoke suite, verify row counts and tenant isolation, and record
the measured RPO/RTO. A restore is not production-ready until this evidence is attached
to the release.
