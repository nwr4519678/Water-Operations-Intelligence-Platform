# Extensible repository map

The repository is organized around deployable boundaries and frontend responsibility. The Viewer can grow without moving shared contracts or coupling future Desktop, Admin, and Operator extensions.

```text
frontend/
  src/
    app/          bootstrap, providers, routing seam
    components/   reusable shared UI components
    features/     vertical product slices
    hooks/        reusable React hooks
    lib/          framework-agnostic utilities
    mocks/        local fixtures and test handlers
    pages/        route-level page composition
    routes/       route definitions and route metadata
    services/     typed API/client adapters
    shared/       i18n and cross-feature contracts
    stores/       client-only state, never server persistence
    tokens/       design tokens and theme definitions
    types/        shared TypeScript types
  tests/          browser and integration-level frontend tests

apps/desktop/     future desktop host; must consume shared web contracts
docs/             architecture, ADRs, API, design, development, deployment
backend/          API and clean-architecture backend boundaries
ai-service/       independent AI bounded component
data-engineering/ ingestion and transformation workflows
infrastructure/  deployment and operational resources
```

## Placement rules

| Location | Responsibility | Example contents |
| --- | --- | --- |
| `routes/` | URL and navigation composition | route records, guards, breadcrumbs |
| `pages/` | Page-level composition | viewer overview, stations, alarms |
| `components/` | Reusable visual primitives | badges, tables, dialogs, shell |
| `hooks/` | Reusable stateful behavior | query, pagination, keyboard behavior |
| `services/` | Transport adapters | typed API clients and mappers |
| `stores/` | Client-only state | UI preferences, filters, locale |
| `mocks/` | Safe local/test data | fixtures, mock handlers |
| `tokens/` | Visual foundations | colors, spacing, typography, themes |
| `types/` | Cross-feature type contracts | identifiers, API envelopes, view models |
| `apps/desktop/` | Future host shell | desktop lifecycle and native integration only |

Feature-specific code stays inside `features/<feature>` when it is not reusable. A folder does not become a shared dependency merely because it is convenient to import.

## Dependency rules

- `pages` may compose `features` and `components`.
- `components` may use `tokens`, `types`, and pure `lib` utilities.
- `services` may use `types`; they do not render UI.
- `stores` may use `types`; server state belongs in the query/client layer.
- `mocks` are development/test-only and never imported by production services.
- `apps/desktop` consumes shared frontend contracts and cannot add admin/operator actions to Viewer components.
