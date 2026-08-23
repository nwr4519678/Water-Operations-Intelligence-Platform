# Production testing strategy

The release gate runs the full solution test suite once after implementation:

- unit tests cover domain rules, handlers, validation, authorization, and client contracts;
- architecture tests verify layer boundaries and controller dependencies;
- integration tests cover HTTP authorization, tenant scope, safe error envelopes, Swagger,
  metrics authorization, and PostgreSQL connectivity;
- SignalR tests must connect a viewer to the telemetry hub and verify scoped events and
  disconnect behavior;
- API contract tests consume the generated Swagger document and reject duplicate or
  undocumented routes;
- the performance baseline script measures health latency and is followed by a load/stress
  run against a release candidate with PostgreSQL and Redis enabled;
- end-to-end release tests promote the same artifact through staging and production-like
  configuration;
- resilience verification stops Redis, injects database connectivity failure, and checks
  readiness, safe errors, recovery, and outbox retry behavior.

Performance, load, failure-injection, and restore results are release evidence; they are
not replaced by a green unit-test count.
