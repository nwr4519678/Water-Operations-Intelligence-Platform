# Foundation sign-off

The Foundation Architecture baseline is implemented as one reviewable change
set on `add/foundation-architecture`, with one commit per FA task. It provides
the contracts and boundaries required by Viewer implementation while keeping
backend, database, production authentication, production realtime, and mutation
workflows out of scope.

## Sign-off checklist

- [x] Strict React/TypeScript/Vite build succeeds.
- [x] Viewer routes use a read-only session and capability boundary.
- [x] Telemetry uses typed ports and deterministic mock adapters.
- [x] Shared UI primitives include accessible table semantics and state views.
- [x] English/Arabic dictionaries and RTL direction are available.
- [x] Offline and reduced-motion behavior is represented.
- [x] Unit/integration tests run with Vitest and Testing Library.
- [x] Lint and diff checks pass.

Production API, SignalR, database, and authentication implementations remain
future tasks behind the documented service boundaries.
