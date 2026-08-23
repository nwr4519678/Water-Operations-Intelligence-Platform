# API governance and data protection

## Contract rules

- Public routes are versioned under /api/v1.
- Every request receives X-Trace-Id and X-API-Version response headers.
- Validation failures use the API validation error envelope and never expose stack traces.
- Swagger is generated from the controller contract and is checked in CI.
- Mutating requests may provide an Idempotency-Key; successful responses are replayed for
  24 hours within the authenticated organization and user scope.

## Privacy and retention

- Organization scope is resolved in the application authorization behavior and repository
  queries must keep that scope when loading data.
- Sensitive configuration is injected through environment variables or user secrets. No
  credentials belong in tracked appsettings files.
- Retention policies are implemented by the Retention feature and scheduled jobs. Production
  deployments must configure the retention window and document the legal basis for each
  exported dataset.
- Logs contain trace and operation metadata only; access tokens, passwords, connection
  strings, and request bodies must not be logged.

## Client compatibility

Breaking changes require a new API version. Additive fields and endpoints remain compatible
within v1. Deprecated endpoints must advertise a removal date in their API documentation.
