# Jobs

Hangfire job definitions and scheduling belong here. Jobs must be idempotent and call Application use cases.

The dedicated `WaterOperations.Worker` process owns Hangfire server execution. The API
registers Hangfire storage/client services for enqueueing but does not start a worker unless
`Worker:Enabled=true` is explicitly configured.

`JobExecution` is the durable idempotency ledger for worker jobs. A completed key is never
executed again; running jobs have an expiry for crash recovery; failures transition to retry
wait or dead-letter state with bounded error text and the next available time.
