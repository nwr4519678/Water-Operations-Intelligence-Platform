# Frontend scope and responsibility boundaries

This document freezes the current foundation scope so the Viewer can be implemented without accidentally introducing Admin or Operator responsibilities.

## Ownership map

| Area | Owns | Does not own in the current foundation |
| --- | --- | --- |
| Foundation Architecture | Application bootstrap, routing seams, shared types, design tokens, API/client boundaries, test conventions, and observability seams | Product workflows, persistence, production identity, or domain mutation rules |
| Viewer | Read-only dashboards, station/telemetry views, alarm and report presentation, filters, legends, loading/error states, and scoped viewer navigation | Create/update/delete actions, role administration, configuration mutations, or unrestricted cross-organization data |
| Admin extension | User and role administration, organization configuration, station/device lifecycle, policy management, and audit administration | Viewer presentation components and Operator workflows |
| Operator extension | Operational acknowledgements, maintenance actions, incident response, and controlled field actions | User/role administration or foundation bootstrapping |

## Explicitly deferred

The current foundation does not implement backend persistence, database migrations, production authentication/authorization, real AI inference, or production SignalR telemetry. Local viewer authentication and synthetic data may exist as development seams, but they are not production capabilities.

## Dependency direction

The frontend depends on stable read contracts and shared presentation types. Pages compose feature components; feature components use shared design-system components; client services translate transport responses into typed view models. Shared components must not import page-specific code or contain role-specific mutation actions.

```text
app shell -> feature pages -> shared components -> typed client contracts
                                 |
                         design tokens / i18n
```

Backend and production service work remains behind the existing API/Application/Domain/Infrastructure boundaries. This document is a frontend scope contract, not authorization for adding backend implementation.

## Review rules

- A new Viewer component must be read-only and scoped to the authenticated viewer context.
- A mutation, administration, or operator workflow requires a separate task and extension boundary.
- Production credentials, secrets, and environment-specific URLs never belong in frontend source.
- New cross-cutting behavior must be represented as a typed contract or shared utility before page-level use.
