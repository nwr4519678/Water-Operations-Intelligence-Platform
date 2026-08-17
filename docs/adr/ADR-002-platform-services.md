# ADR-002: Hangfire, Redis hybrid cache, and Scalar

## Decision

Use Hangfire for durable scheduled/background work, .NET HybridCache with Redis for multi-instance caching, and Scalar over the generated OpenAPI document for interactive API documentation.

## Consequences

Jobs must be idempotent and cache invalidation must be designed per use case. The API remains OpenAPI-compatible for other tooling and clients.
