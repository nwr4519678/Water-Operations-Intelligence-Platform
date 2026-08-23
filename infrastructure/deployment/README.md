# Deployment manifests

Environment-specific deployment configuration lives here. `development.yaml` describes the local shape; `production.yaml` defines rolling deployment, three API replicas, readiness/liveness probes, secret references, and automatic rollback expectations.

```mermaid
flowchart LR
  Image[Versioned API/UI images] --> Staging[Staging]
  Staging --> Approve{Approved?}
  Approve -->|yes| Prod[Production rolling update]
  Approve -->|no| Stop[Stop promotion]
  Prod --> Probe[Readiness probe]
  Probe -->|fail| Revert[Rollback]
```

Do not place credentials in manifests. Use deployment environment secrets and run release smoke checks after rollout.
