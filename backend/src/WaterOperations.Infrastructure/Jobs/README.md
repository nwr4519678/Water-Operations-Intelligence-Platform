# Jobs

Hangfire job definitions and scheduling belong here. Jobs must be idempotent and call Application use cases.

The dedicated `WaterOperations.Worker` process owns Hangfire server execution. The API
registers Hangfire storage/client services for enqueueing but does not start a worker unless
`Worker:Enabled=true` is explicitly configured.
