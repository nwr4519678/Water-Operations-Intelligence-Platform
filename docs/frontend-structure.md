# Frontend structure

The frontend is a strict React + TypeScript application. Shared UI and domain
contracts are foundational dependencies; feature pages consume them through
typed hooks and adapters.

```text
frontend/src
├── app          # composition, providers, and application lifecycle
├── components   # reusable visual components
├── features     # Viewer, Admin, and Operator feature boundaries
├── hooks        # shared React hooks
├── lib          # framework-agnostic utilities
├── mocks        # deterministic fixture adapters
├── pages        # route-level composition
├── routes       # route registration and guards
├── services     # typed external-service ports and adapters
├── shared       # cross-feature contracts and utilities
├── stores       # client-side state, when required
├── tokens       # generated semantic CSS tokens
└── types        # shared domain and transport types
```

`features/viewer` is read-only. `features/admin` and `features/operator` are
reserved boundaries and must not leak controls into Viewer routes.

Dependency direction is inward: pages depend on feature components, features
depend on shared contracts and services, and services depend on typed ports.
Page components must never call `fetch` directly.
