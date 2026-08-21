# Backend Production-Ready Execution Plan

## 1. Purpose and scope

This document is the authoritative implementation backlog for completing the backend of the Water Operations Intelligence Platform.

It converts the attached product specification into executable backend work. Text in the attached specification is treated as product requirements; this file is the implementation plan for the repository. It does not grant permission to implement frontend, desktop, infrastructure, or Python work unless a task explicitly includes the required backend contract or integration boundary.

The target backend is:

- ASP.NET Core .NET 10 Web API.
- Clean Architecture: Domain, Application, Infrastructure, API, and Worker boundaries.
- PostgreSQL/TimescaleDB only.
- REST APIs for both web and desktop clients.
- SignalR for real-time updates.
- Python AI service accessed only through an authenticated internal .NET gateway.
- Multi-tenant authorization enforced server-side.
- Production observability, security, migrations, testing, deployment, and recovery procedures.

## 2. Current status after the PostgreSQL refactor

The repository is a foundation/prototype, not a complete production backend.

### Completed or partially completed

- PostgreSQL EF Core provider is used by Infrastructure.
- PostgreSQL migration and generated bootstrap script exist.
- Domain entities are grouped under `Entities/AI`, `Core`, `Operations`, `Platform`, `Reporting`, `Security`, `Telemetry`, `Views`, `Functions`, and `ProcedureResults`.
- DbContext is under `Persistence/Context` and repositories under `Persistence/Repositories`.
- PostgreSQL filtered-index syntax was corrected for unread notifications, device identifiers, and active thresholds.
- PostgreSQL reporting views and `ufn_StationMeasurements` are represented in a reporting migration.
- Basic Viewer read endpoints, exception envelope, trace ID middleware, health checks, and architecture tests exist.
- Current automated tests pass in the repository test environment.

### Known limitations that still block production

- Authentication uses `DevelopmentViewer` configuration and in-memory sessions instead of database-backed users and refresh-token rotation.
- Only the `VIEWER` role/policy is implemented; `ADMIN`, `OPERATOR`, permissions, resource policies, and client assignment are not complete.
- `/api/v1/telemetry` returns an in-memory `TelemetryStore`, not PostgreSQL measurements.
- The API exposes only a small Viewer read surface; most required REST endpoints are absent.
- SignalR has subscription logic but no complete typed event publication pipeline.
- The Python AI service currently exposes health and an empty models response only.
- No completed .NET AI gateway, retry/circuit-breaker policy, or internal service authentication exists.
- Ingestion, cleaning, quarantine, feature-store maintenance, data-quality jobs, and TimescaleDB policies are not implemented end-to-end.
- Reports, exports, notifications, scheduled reports, audit workflows, imports, sharing, collaboration, and administration APIs are incomplete.
- Integration tests use in-memory database paths; a real PostgreSQL/TimescaleDB migration and query test must be added.
- The local PostgreSQL connection could not be authenticated with the current configured credentials during EF CLI inspection; credentials and environment health must be fixed before claiming database deployment readiness.
- EF-generated migration analysis reports `CA1861` warnings. They do not currently break compilation, but generated-code warning policy must be decided and enforced.

## 3. Definition of production ready

The backend is production-ready only when all of the following are true:

- Every public endpoint has an explicit contract, validation, authorization policy, tenant scope, error behavior, OpenAPI description, and automated tests.
- No endpoint uses in-memory business data, development credentials, placeholder results, or silent fallback behavior in production mode.
- PostgreSQL migrations apply successfully to a clean TimescaleDB instance and upgrade a representative existing database.
- All tenant-owned reads and writes are organization-scoped at the database/query boundary, not only in controllers.
- Refresh tokens are hashed, rotated, revocable, device-aware, and persisted.
- Secrets are externalized and production startup fails safely when mandatory secrets are missing.
- Background jobs are durable, idempotent, observable, retry-safe, and protected against duplicate execution.
- Real-time events are authorization-scoped and delivered from committed state changes.
- AI calls fail gracefully, have timeouts and resilience policies, and never expose the Python service publicly.
- Raw telemetry is append-only, clean telemetry is lineage-aware, and invalid data is quarantined rather than silently dropped.
- Security, performance, accessibility-supporting API metadata, operational runbooks, backup/restore, and incident procedures are documented.
- CI gates build, lint, test, migration validation, security scanning, API compatibility, and container health.

## 4. Priority model

- `P0`: security, data integrity, deployment blockers, or core API blockers. Must be completed before production pilot.
- `P1`: required product capability or operational reliability. Must be completed before general release.
- `P2`: important platform completeness and scale improvements. May follow the first production release only with an explicit risk decision.
- `P3`: experience enhancements and optimization after core reliability is proven.

## 5. Workstream A — PostgreSQL and EF Core hardening

### A-001 [P0] Make PostgreSQL the only runtime database

- Remove every SQL Server provider, factory, configuration key, script, README instruction, and startup branch.
- Keep PostgreSQL connection configuration in one documented source.
- Use `NpgsqlDataSource` where appropriate for pooling, logging, and health integration.
- Make the database name `water_operations_intelligence_platform` consistent across `.env`, Compose, appsettings, scripts, and docs.
- Acceptance: repository search finds no executable SQL Server code, provider, or bootstrap reference; production startup uses only Npgsql.

### A-002 [P0] Normalize PostgreSQL model configuration

- Replace generated provider artifacts with intentional PostgreSQL names and mappings.
- Ensure all filtered-index predicates use PostgreSQL expressions.
- Decide and implement PostgreSQL-native optimistic concurrency, preferably `xmin` or an explicit UUID/version column; do not use SQL Server `rowversion` semantics.
- Map UTC timestamps consistently as `timestamp with time zone` and enforce UTC at boundaries.
- Map JSON payloads to `jsonb` with explicit serialization rules.
- Map enums/status values through controlled constants or PostgreSQL enums only if migration governance supports them.
- Acceptance: generated migration contains PostgreSQL types and predicates only; no `IsRowVersion`, bracketed predicates, SQL Server default functions, or provider-specific artifacts remain.

### A-003 [P0] Migration lifecycle

- Keep a single ordered migration chain: schema, indexes/extensions, reporting objects, Timescale policies, and seed/reference data where appropriate.
- Add migration tests against a clean disposable PostgreSQL/TimescaleDB instance.
- Add upgrade tests from the previous schema version.
- Do not call `EnsureCreated` in production paths; use migrations only.
- Add a migration lock/runbook so multiple API replicas do not race at startup.
- Acceptance: clean install and upgrade both succeed; `dotnet ef migrations has-pending-model-changes` returns no pending model changes.

### A-004 [P0] TimescaleDB design

- Create hypertables for `Telemetry.MeasurementRaw` and `Telemetry.MeasurementClean` with a documented time/partition strategy.
- Add retention, compression/columnstore, and continuous aggregate policies with safe defaults and environment configuration.
- Verify foreign-key/index compatibility with hypertables.
- Add a migration-safe policy for installations that use PostgreSQL without TimescaleDB, or explicitly reject unsupported deployments.
- Acceptance: a real TimescaleDB integration test proves insert, range query, aggregate, retention-policy metadata, and migration behavior.

### A-005 [P1] Database constraints and indexes

- Add check constraints for severity, status, quality flags, units, valid ranges, and timestamp ordering.
- Add uniqueness and idempotency constraints for station/parameter/time keys and ingestion batch identifiers.
- Review cascade behavior to prevent accidental tenant-wide deletes.
- Add query-specific indexes for tenant, station, parameter, time range, status, and open alarms.
- Acceptance: invalid database-level writes fail predictably and explainably; query plans are reviewed for overview, alarms, and measurements.

## 6. Workstream B — Identity, authentication, authorization, and tenancy

### B-001 [P0] Database-backed users and roles

- Implement user creation, invitation, activation/deactivation, password hash storage, password reset, and login-attempt tracking.
- Seed only non-secret reference roles and permissions: `VIEWER`, `OPERATOR`, `ADMIN`, plus extensible custom roles.
- Store client assignment (`DESKTOP`, `WEB`, or both) and enforce it server-side where required.
- Acceptance: no production login path depends on `DevelopmentViewer` settings.

### B-002 [P0] Secure token lifecycle

- Implement short-lived access tokens with stable subject/user/organization claims.
- Persist only hashes of refresh tokens in `Security.Session`.
- Rotate refresh tokens on every refresh, detect reuse, revoke the token family, and support logout-all-devices.
- Add device/session metadata, expiry, last-used time, IP/user-agent policy, and revocation reason.
- Use a strong production signing key from secret storage; fail startup if a development fallback is used outside Development/Test.
- Acceptance: refresh replay is rejected and audited; token secrets never appear in logs or responses beyond intended token values.

### B-003 [P0] Authorization policy system

- Define permission constants and policies for read, acknowledge, resolve, annotate, configure, import, export, report, AI, user management, audit, and system administration.
- Implement resource-level authorization for organization, region, station, alarm, report, and user resources.
- Ensure `403` is returned for authenticated-but-forbidden requests and `401` for unauthenticated requests.
- Protect SignalR group joining with server-derived scope; clients must not choose arbitrary organization/region groups.
- Acceptance: authorization matrix tests cover every role, client type, organization, region, and station scope.

### B-004 [P0] Tenant scope enforcement

- Introduce a request-scoped `ITenantContext` sourced from validated identity claims.
- Apply organization filters in application queries and repository specifications.
- Require organization ID on every tenant-owned command and compare it against the tenant context.
- Consider PostgreSQL row-level security for defense in depth after application filters are correct.
- Acceptance: cross-tenant IDs return not-found or forbidden according to policy and never leak existence through counts, errors, exports, or SignalR.

### B-005 [P1] MFA and account security

- Implement TOTP enrollment, encrypted secret storage, recovery codes, MFA challenge, and admin reset flow.
- Add password policy, breach-resistant rate limiting, lockout/backoff, and security notifications.
- Acceptance: MFA is required for configured roles and all sensitive changes require recent authentication where policy demands it.

## 7. Workstream C — Core telemetry and operations APIs

### C-001 [P0] Replace in-memory telemetry

- Remove `TelemetryStore` from production registrations.
- Build query handlers against `MeasurementClean`, reporting views, and Timescale aggregates.
- Add server pagination, cursor/time-window limits, parameter filters, quality filters, and maximum result sizes.
- Acceptance: all dashboard telemetry comes from PostgreSQL and returns stable DTOs with UTC timestamps and quality metadata.

### C-002 [P0] Overview and KPI API

- Implement `GET /api/v1/overview` with organization/region scope, station counts, online/offline counts, open alarm counts, latest telemetry, focus stations, and service status.
- Support an `asOf` timestamp and deterministic response metadata.
- Acceptance: KPI totals reconcile with database queries and are covered by PostgreSQL integration tests.

### C-003 [P0] Station and topology API

- Implement paginated station search/filter/sort, station details, regions, parameters, connections, station links, coordinates, status, and last-seen information.
- Add admin-only station create/update/deactivate, parameter assignment, connection management, and topology validation.
- Acceptance: station detail never returns a station outside the caller tenant and supports stable pagination.

### C-004 [P0] Measurement ingestion API

- Implement authenticated ingestion for batches and single readings where required.
- Validate device identity, organization ownership, timestamp bounds, unit, numeric range, duplicate key, and payload size.
- Store raw readings append-only with ingestion batch, source, received timestamp, checksum, and duplicate relationship.
- Make retries idempotent using a client batch/read identifier and database uniqueness constraints.
- Acceptance: retrying the same batch does not duplicate data; invalid rows are quarantined with reasons.

### C-005 [P0] Alarm lifecycle API

- Implement alarm list/detail with server filters and smart grouping support.
- Implement acknowledge, resolve, reopen where allowed, notes, related measurements, and audit records.
- Require idempotency keys for mutations and publish events only after successful commit.
- Acceptance: role and tenant tests cover every state transition and concurrent update behavior.

### C-006 [P1] Threshold API

- Implement threshold history, effective dating, validation of low/high relationships, activation/deactivation, and station/parameter scope.
- Re-evaluate thresholds through a durable job, not in request handlers.
- Acceptance: overlapping active thresholds are rejected or resolved deterministically, and every edit is audited.

### C-007 [P1] Chart and measurement query API

- Add range queries, downsampling resolution, multi-parameter overlay, threshold lines, interpolation flags, and export-safe limits.
- Expose a typed query for `ufn_StationMeasurements` or a query handler with equivalent semantics.
- Acceptance: large ranges do not load unbounded rows into API memory; interpolated values remain distinguishable.

## 8. Workstream D — Real-time SignalR

### D-001 [P0] Typed telemetry hub contract

- Define strongly typed server-to-client events: `MeasurementUpdated`, `StationStatusChanged`, `AlarmTriggered`, `AlarmAcknowledged`, `AlarmResolved`, `AnomalyDetected`, and `ModelPromoted`.
- Define event payload DTOs shared by REST and SignalR contracts.
- Add connection lifecycle, heartbeat, reconnect, and protocol version metadata.
- Acceptance: clients can subscribe to authorized organization/region/station scopes and receive only allowed events.

### D-002 [P0] Event publication pipeline

- Publish domain/integration events through an outbox table after transaction commit.
- Deliver SignalR events from an outbox publisher with retry and deduplication.
- Never publish an event for a transaction that later rolls back.
- Acceptance: an integration test proves commit, reconnect, duplicate delivery handling, and rollback behavior.

### D-003 [P1] Scale-out readiness

- Use Redis backplane or an equivalent durable event strategy for multiple API replicas.
- Add group membership expiration/revalidation and permission refresh behavior.
- Acceptance: two API replicas deliver the same authorized event without cross-tenant leakage.

## 9. Workstream E — Data engineering boundary

### E-001 [P0] Raw-to-clean pipeline contract

- Define the .NET-to-Python or queue contract for raw batch arrival, validation result, clean rows, quarantined rows, and lineage.
- Keep raw rows immutable; never overwrite source values during cleaning.
- Store cleaning ruleset version and source raw ID on clean rows.
- Acceptance: each clean/quarantined row can be traced back to an ingestion batch and source row.

### E-002 [P0] Data quality API

- Implement `GET /api/v1/ai/data/quality` or the approved public contract through the .NET gateway.
- Expose valid, interpolated, quarantined, duplicate, schema drift, and processing-lag metrics.
- Acceptance: data-quality metrics are tenant-scoped, time-windowed, and consistent with database counts.

### E-003 [P1] Bulk imports

- Implement admin-only CSV/Excel/JSON upload with size limits, content validation, staging, conflict preview, skip/overwrite decision, progress, and job polling.
- Never import directly into production measurement tables before validation.
- Acceptance: malformed files, duplicate timestamps, unknown stations, unit mismatches, and partial failures have explicit outcomes.

## 10. Workstream F — .NET AI Gateway and Python integration

### F-001 [P0] Internal AI client

- Add a dedicated `WaterOperations.AiClient` abstraction/project.
- Configure typed `HttpClient`, private base URL, service token or mTLS, request timeout, retry only for safe requests, circuit breaker, bulkhead, correlation ID, and response validation.
- Do not expose Python URLs, credentials, or internal errors to clients.
- Acceptance: AI service unavailable produces a stable `AI_UNAVAILABLE` response and does not stall API threads.

### F-002 [P0] AI public endpoints

Implement and authorize:

- `GET /api/v1/ai/forecast/{stationId}`.
- `GET /api/v1/ai/anomalies`.
- `GET /api/v1/ai/maintenance/predictions`.
- `GET /api/v1/ai/stations/clusters`.
- `POST /api/v1/ai/alarms/triage`.
- `GET /api/v1/ai/reports/{reportId}/summary`.
- `GET /api/v1/ai/focus-stations`.
- `GET /api/v1/ai/alarms/{alarmId}/fault-probability`.
- `GET /api/v1/ai/risk-score`.
- `GET /api/v1/ai/models` for administrators.
- `POST /api/v1/ai/models/{modelId}/retrain` for administrators.
- `POST /api/v1/ai/data/bulk-import` and job-status/conflict endpoints for administrators.
- `GET /api/v1/ai/data/quality` for administrators.

Acceptance: every endpoint has request validation, authorization, tenant scope, timeout behavior, OpenAPI examples, and contract tests against a fake AI service.

### F-003 [P1] Model registry integration

- Read/write model metadata, training runs, metrics, feature version, cleaning ruleset version, status, and artifact references.
- Implement candidate/promoted/retired transitions and promotion gates.
- Audit every retrain, promotion, retirement, and failed run.
- Acceptance: a worse candidate cannot replace a promoted model.

### F-004 [P1] AI cold-start behavior

- Return explicit states such as `LEARNING_IN_PROGRESS`, `AI_UNAVAILABLE`, `NO_MODEL`, and `READY`.
- Never fabricate predictions or silently substitute stale values without metadata.
- Acceptance: API responses expose confidence, model version, data window, and source status.

## 11. Workstream G — Reports, exports, notifications, and collaboration

### G-001 [P1] Reports

- Implement asynchronous report creation, status, download, history, station/parameter/date filters, PDF/Excel/CSV output, and authorization.
- Store report metadata and artifact lifecycle; never hold large files in API memory.
- Add deterministic statistical narrative summaries; generative text is not permitted unless separately approved and constrained.
- Acceptance: report jobs survive API restart and produce reproducible results.

### G-002 [P1] Scheduled reports

- Implement daily/weekly/monthly schedules, timezone handling, recipient authorization, retry policy, pause/resume, and run history.
- Use durable Hangfire/Quartz jobs with distributed locking and idempotency.
- Acceptance: a schedule produces one report per period even after worker restart.

### G-003 [P1] Notifications

- Implement notification center, unread count, mark read, per-user severity/channel preferences, email/web/desktop event contracts, and digest jobs.
- Apply tenant and user ownership to every notification query.
- Acceptance: notification preference changes are audited and delivery failures are retryable without duplication.

### G-004 [P1] Audit log

- Record authentication, authorization failures where required, alarm actions, threshold changes, user/role changes, imports, exports, report operations, AI retrains/promotions, and configuration changes.
- Make audit records append-only at application and database permission levels.
- Add admin filtering, date range, actor, action, resource, and export APIs.
- Acceptance: every privileged mutation maps to an audit record with before/after metadata and trace ID.

### G-005 [P2] Sharing and collaboration

- Implement expiring, revocable, read-only snapshot tokens with hashed storage and scope validation.
- Implement station collaboration threads, handover notes, chart annotations, edit history, and moderation/retention policy.
- Acceptance: shared links cannot mutate data or cross organization boundaries.

## 12. Workstream V — Complete Viewer implementation

The platform has three first-class personas: `ADMIN`, `OPERATOR`, and `VIEWER`. Viewer is a complete read-only operational intelligence product, not a placeholder page or a reduced authentication role. The server must enforce every Viewer restriction; hiding buttons in the client is not authorization.

### V-001 [P0] Viewer role, permissions, and scope

- Define `overview.read`, `map.read`, `stations.read`, `measurements.read`, `alarms.read`, `charts.read`, `reports.read`, `ai.insights.read`, `notifications.read`, `settings.self.write`, and approved `reports.create` permissions.
- Explicitly deny Viewer access to alarm acknowledge/resolve, thresholds, ingestion, imports, station configuration, user/role management, audit administration, retraining, model promotion, and organization settings.
- Use stable `userId`, `organizationId`, region/station assignments, role, client type, locale, and timezone claims/context; eliminate string-only scope authority such as `A` and `1`.
- Acceptance: an authorization matrix covers every Viewer endpoint, command, export, and SignalR group.

### V-002 [P0] Viewer overview

Implement `GET /api/v1/viewer/overview` with:

- Total, online, offline, degraded station KPIs.
- Active, critical, and warning alarm counts.
- Latest telemetry summaries with units, timestamps, quality flags, and stale-data status.
- Recent alarms, focus stations, attention-soon results, region summaries, `asOf`, server time, freshness, and partial-service metadata.
- Acceptance: PostgreSQL-backed totals reconcile with reporting views and are deterministic for a fixed `asOf` value.

### V-003 [P0] Viewer map and station directory

- Implement `GET /api/v1/viewer/map/stations` with bounding box, region, status, search, pagination, and result limits.
- Return coordinates, status, last-seen time, open/critical alarm counts, enabled parameters, and freshness.
- Return unmapped stations explicitly and expose topology/links for read-only flow visualization.
- Acceptance: map queries are tenant/scope-safe, bounded, cacheable, and cannot enumerate unauthorized stations.

### V-004 [P0] Viewer station details

- Implement `GET /api/v1/viewer/stations/{stationId}`.
- Return metadata, region, coordinates, connection health, parameters, latest values, quality, recent alarms, anomaly badge, risk summary, and forecast availability.
- Provide compact and full responses to avoid over-fetching.
- Acceptance: station detail is read-only, PostgreSQL-backed, and scope-safe.

### V-005 [P0] Viewer measurements and charts

- Implement `GET /api/v1/viewer/stations/{stationId}/measurements` with parameter, range, resolution, quality, interpolation, cursor, and maximum-range controls.
- Return UTC timestamps, value, canonical unit, quality flag, `isInterpolated`, lineage metadata, and downsampling metadata.
- Support multi-parameter series and read-only threshold reference lines.
- Use TimescaleDB continuous aggregates/server-side downsampling for large ranges.
- Acceptance: unbounded measurement loads are impossible and interpolated values are visibly distinguishable by contract.

### V-006 [P0] Viewer alarms

- Implement `GET /api/v1/viewer/alarms` with station, region, severity, status, search, time range, sort, and cursor pagination.
- Implement `GET /api/v1/viewer/alarms/{alarmId}` with station context, trend snapshot, threshold context, related/similar alarms, and safe label metadata.
- Viewer can inspect alarms but cannot acknowledge, resolve, relabel, or edit them.
- Acceptance: forbidden mutations return `403` and no internal or cross-tenant user data leaks.

### V-007 [P0] Viewer real-time contract

- Define typed events: `MeasurementUpdated`, `StationStatusChanged`, `AlarmTriggered`, `AlarmAcknowledged`, `AlarmResolved`, `AnomalyDetected`, `DataQualityChanged`, and `AiAvailabilityChanged`.
- Derive SignalR groups from validated server scope, revalidate assignments, and provide reconnect/missed-event recovery metadata.
- Publish events after commit through the outbox pipeline.
- Acceptance: Viewer receives only authorized updates and clearly receives reconnect/stale state.

### V-008 [P1] Viewer reports and exports

- Implement allowed Viewer report creation, status, download, and history APIs with station/region/parameter/date filters.
- Support asynchronous PDF/Excel/CSV generation, row limits, artifact expiry, tenant scope, and deterministic statistical summaries.
- Viewer cannot edit schedules, recipients, ownership, or another user's reports.
- Acceptance: report jobs survive worker restart and never return data outside Viewer scope.

### V-009 [P1] Viewer AI insights

- Provide read-only forecast, anomaly, maintenance attention, clusters, focus stations, alarm triage explanation, fault probability, and risk score endpoints where policy permits.
- Every response includes model state, confidence/score, generated time, input window, and lineage versions where safe.
- Distinguish `READY`, `LEARNING_IN_PROGRESS`, `NO_MODEL`, and `AI_UNAVAILABLE`; never fabricate predictions.
- Acceptance: AI requests are scope-checked before reaching the internal Python gateway.

### V-010 [P1] Viewer notifications and personal settings

- Implement notification list, unread count, paging, mark-read, and safe dismissal.
- Allow only personal locale, timezone, theme, decimal precision, landing page, and approved notification preferences.
- Acceptance: personal settings are user/tenant scoped, validated, concurrency-safe, and audited where required.

### V-011 [P1] Viewer cache and resilience

- Add ETags/cache headers for overview, directory, station metadata, and read-only alarms.
- Return `dataAsOf`, `lastSuccessfulRefresh`, and `isStale` metadata.
- Permit stale read-only display during outage but never treat cache as authoritative for mutations.
- Acceptance: cache keys include tenant, user scope, filters, and API version; stale data is explicit.

### V-012 [P0] Viewer end-to-end journey

- Test login, overview, map filtering, station detail, large chart range, alarms, SignalR update, AI ready/unavailable state, report flow, notifications, and personal settings.
- Attempt acknowledge, resolve, threshold edit, import, user administration, retrain, and cross-tenant access; all must be denied safely.
- Run against real PostgreSQL/TimescaleDB and a fake/unavailable AI service with no placeholder data.

## 13. Workstream H — Platform and administration APIs

### H-001 [P1] Organization administration

- Organization CRUD, branding, locale/timezone, region management, activation, and tenant-level settings.
- Acceptance: only authorized administrators can mutate organization configuration.

### H-002 [P1] User and role administration

- Invite, activate/deactivate, reset MFA, assign roles, assign client type, list/revoke sessions, and force logout.
- Acceptance: administrators cannot remove the last usable administrator without an explicit recovery path.

### H-003 [P1] Settings and dashboard layouts

- User preferences: theme, timezone, locale, decimal precision, landing page.
- Dashboard layout versioning, validation, size limits, default layouts, and conflict handling.
- Acceptance: settings are tenant/user scoped and safely fall back when a layout is invalid.

### H-004 [P2] Search and command APIs

- Global search across stations, alarms, reports, and users according to permissions.
- Add pagination, ranking, minimum query length, rate limiting, and audit rules.

## 14. Workstream I — Validation, errors, and API governance

### I-001 [P0] API contract standards

- Use a single versioning convention and stable envelope/problem-details format.
- Define correlation ID, trace ID, error code, field errors, pagination metadata, and UTC date format.
- Add OpenAPI security schemes, authorization descriptions, examples, and deprecation policy.
- Acceptance: generated client contracts can be consumed by both desktop and web clients without handwritten ambiguity.

### I-002 [P0] Validation

- Add FluentValidation for every command/query input, including route/query cross-field rules.
- Reject excessive page sizes, invalid date ranges, invalid identifiers, unsafe file types, and unsupported content types.
- Acceptance: validation errors never expose stack traces or database messages.

### I-003 [P1] Idempotency and concurrency

- Add idempotency middleware/storage for ingestion, alarm mutations, report creation, imports, retrains, and notifications.
- Define optimistic concurrency response behavior (`409`) for user/station/threshold/alarm updates.
- Acceptance: client retries are safe and concurrent writes produce deterministic outcomes.

## 15. Workstream J — Background processing

### J-001 [P0] Worker boundary

- Add a dedicated Worker project for report generation, threshold evaluation, outbox delivery, notification delivery, retention maintenance, and reconciliation.
- Keep heavy AI training and data-engineering jobs in the Python service as specified.
- Acceptance: API process does not execute long-running work on request threads.

### J-002 [P0] Job reliability

- Every job has a unique key, durable state, timeout, retry/backoff, dead-letter/failure state, cancellation, and metrics.
- Use distributed locks for singleton jobs and per-model locks for retraining triggers.
- Acceptance: restarting a worker does not duplicate reports, notifications, outbox events, or threshold alarms.

## 16. Workstream K — Security hardening

### K-001 [P0] Secrets and configuration

- Remove default signing keys and production passwords.
- Validate configuration at startup with environment-specific options.
- Use secret manager/container secrets and redact connection strings, tokens, passwords, and PII from logs.
- Acceptance: production configuration fails closed when mandatory secrets are absent.

### K-002 [P0] Network and transport security

- Enforce HTTPS, secure SignalR transport, HSTS, restricted CORS, request-size limits, and trusted proxy configuration.
- Restrict AI service to private network/loopback and authenticate service-to-service calls.
- Acceptance: AI service cannot be reached from the public client network.

### K-003 [P1] Abuse protection

- Add per-user/IP/tenant rate limits for login, refresh, ingestion, exports, search, reports, and AI endpoints.
- Add payload limits, timeout budgets, cancellation propagation, and query cost limits.
- Acceptance: abuse tests prove the API remains responsive under malformed and high-volume requests.

### K-004 [P1] Security verification

- Add dependency scanning, secret scanning, SAST, container scanning, OWASP API checks, and penetration-test remediation tracking.
- Add tests for IDOR, tenant escape, refresh replay, privilege escalation, SSRF, mass assignment, and log injection.

## 17. Workstream L — Observability and operations

### L-001 [P0] Health endpoints

- Separate liveness from readiness.
- Readiness checks PostgreSQL, Redis, worker/outbox lag, and AI service connectivity without leaking credentials.
- Expose detailed health only to authorized internal/admin callers.
- Acceptance: orchestration removes an unhealthy instance and does not restart a live-but-not-ready instance incorrectly.

### L-002 [P0] Structured logging and tracing

- Add structured logs with trace ID, request ID, tenant ID, user ID, endpoint, status, duration, and job ID where safe.
- Add OpenTelemetry traces/metrics for API, database, Redis, SignalR, jobs, and AI gateway calls.
- Acceptance: one user action can be traced from REST request through DB/job/AI event without exposing secrets.

### L-003 [P1] Metrics and alerting

- Track request latency/errors, database pool exhaustion, ingestion lag, invalid/quarantined rate, active alarms, outbox lag, job failures, SignalR connections, AI latency/error rate, and model freshness.
- Define alert thresholds, dashboards, and on-call runbooks.

### L-004 [P1] Backup and disaster recovery

- Document PostgreSQL backup frequency, WAL/PITR, encryption, restore test frequency, retention, and RPO/RTO.
- Include model artifacts, migration history, and operational configuration in recovery planning.
- Acceptance: a restore drill is executed and timed.

## 18. Workstream M — Testing strategy

### M-001 [P0] Unit tests

- Domain invariants, tenant scope, authorization rules, validation, token rotation, idempotency, alarm state machine, threshold rules, report parameters, and AI gateway response mapping.

### M-002 [P0] PostgreSQL integration tests

- Run against real PostgreSQL/TimescaleDB using Testcontainers or a dedicated CI service.
- Apply migrations, create views/functions, seed reference data, execute representative queries, verify filtered indexes, and test transaction/concurrency behavior.

### M-003 [P0] API contract tests

- Cover auth, refresh/logout, viewer/operator/admin permissions, overview, stations, measurements, alarms, thresholds, reports, imports, AI proxy endpoints, health, and error envelopes.

### M-004 [P1] Real-time tests

- Authorized group join, forbidden group join, event publication after commit, reconnect, duplicate event handling, and multi-instance backplane behavior.

### M-005 [P1] Performance tests

- Baselines for overview, station search, measurement range queries, alarm list, ingestion batch size, report creation, and AI proxy latency.
- Test realistic telemetry volumes and retention/aggregate behavior.

### M-006 [P1] End-to-end release tests

- Login by each role, complete operator alarm workflow, admin configuration workflow, viewer read-only workflow, report generation, import workflow, and AI-unavailable fallback.

## 19. Workstream N — CI/CD and release governance

### N-001 [P0] CI quality gates

- Restore/build with warnings policy.
- Unit, architecture, integration, API contract, and migration tests.
- Formatting, analyzers, dependency scan, secret scan, and container build.
- Validate OpenAPI compatibility and database migration script generation.

### N-002 [P0] Environment promotion

- Separate Development, Test, Staging, and Production settings/secrets.
- Apply migrations as a controlled release step with rollback plan; do not rely on every API replica migrating simultaneously.
- Add smoke tests after deployment and automatic rollback criteria.

### N-003 [P1] Versioning and compatibility

- Version REST and SignalR contracts.
- Maintain backward compatibility during client rollout.
- Document breaking changes and migration notes.

## 20. Recommended execution order

1. Complete A-001 through A-005 and establish a real PostgreSQL/TimescaleDB test environment.
2. Complete B-001 through B-004 before adding privileged endpoints.
3. Replace in-memory telemetry and implement C-001 through C-007.
4. Implement D-001 through D-003 with the outbox pattern.
5. Add J-001/J-002 so long-running work has a production execution boundary.
6. Implement I-001 through I-003, K-001 through K-004, and L-001 through L-002.
7. Implement E-001 through E-003 and F-001 through F-004.
8. Implement G and H platform modules.
9. Complete V-001 through V-012 as the full Viewer product track, including real-client E2E and forbidden-action tests.
10. Complete M testing levels, N release gates, backup/restore, and operational drills.
11. Only then enable P2/P3 experience and optimization work.

## 21. Release gates

### Gate 1 — Secure foundation

- Database migrations pass on real PostgreSQL/TimescaleDB.
- Database-backed identity, refresh rotation, roles, permissions, and tenant scope pass tests.
- No in-memory production stores remain.

### Gate 2 — Core operations

- Overview, stations, measurements, ingestion, alarms, thresholds, and SignalR are complete.
- Outbox and worker processing are durable and observable.

### Gate 2.5 — Complete Viewer

- Viewer overview, map, station directory/detail, charts, measurements, alarms, reports, AI insights, notifications, personal settings, cache/resilience, and SignalR are complete.
- Viewer has no placeholder or in-memory production data and no unauthorized mutation path.
- Viewer E2E and cross-tenant/privilege-denial tests pass against real PostgreSQL/TimescaleDB.

### Gate 3 — Platform completeness

- Reports, notifications, audit, administration, imports, exports, settings, and sharing are complete according to their priorities.

### Gate 4 — AI/data readiness

- AI gateway, data-quality contract, model registry, import jobs, cold-start states, and Python service integration are complete.

### Gate 5 — Production certification

- Security scan and penetration findings are closed or formally accepted.
- Performance, backup/restore, failure injection, deployment rollback, and real-client end-to-end tests pass.
- Runbooks, dashboards, alerts, ownership, and support escalation are approved.

## 22. Task tracking format

Each implementation issue should include:

- Task ID from this document.
- Scope and affected project/files.
- Database/API contract changes.
- Security and tenant-scope impact.
- Migration requirement.
- Tests added or updated.
- Observability added.
- Rollout and rollback notes.
- Acceptance criteria and evidence.

No task is complete merely because it compiles. It is complete only when its acceptance criteria, migration impact, authorization behavior, tests, and operational behavior are verified.
