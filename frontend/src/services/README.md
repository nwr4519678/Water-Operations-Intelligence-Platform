# Services

Generated or hand-written API clients belong here. Components do not call `fetch` directly.

The shared viewer services provide:

- `ApiClient` for envelope unwrapping, trace IDs, bearer auth, refresh-once behavior, and bounded timeouts.
- `authStore`, `createAuthService`, and `AuthGuard` for session lifecycle and route protection.
- `createViewerApi` and `cacheKeys` for typed viewer resources.
- `createSignalRService` for telemetry reconnects and event-driven cache invalidation.
- `createMockViewerApi` for local work when `VITE_MOCK_SERVICES=true`.

Set `VITE_API_BASE_URL` when the API is not served from the same origin. Query retries are limited to two attempts and never retry 401, 403, or timeout errors. AI insight failures should be handled independently from core viewer queries so overview, station, measurement, and alarm data remain usable.
