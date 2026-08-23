# Deployment and release operations

The release path is governed by CI, protected staging/production environments, versioned artifacts, health gates, and explicit rollback procedures.

```mermaid
flowchart LR
  Commit[Commit / pull request] --> CI[Build + tests + static gates]
  CI --> Candidate[Versioned release candidate]
  Candidate --> Staging[Staging environment approval]
  Staging --> Smoke[Health / Swagger / metrics smoke]
  Smoke --> Production[Production approval]
  Production --> Rollout[Rolling deployment]
  Rollout --> Ready[/health/ready]
  Ready --> Live[/health/live]
  Ready -. failure .-> Rollback[Automatic/manual rollback]
```

Deployment manifests are under `infrastructure/deployment`; Docker assets are under `infrastructure/docker`; migration and backup scripts are under `infrastructure/database`. Secrets are injected by the deployment platform, never committed.

See [release governance](../production-readiness/release-governance.md) and run `scripts/release-smoke.ps1` after each deployment.
