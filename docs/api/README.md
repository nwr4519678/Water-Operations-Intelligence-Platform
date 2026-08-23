# API guide

The API is versioned under `/api/v1`. Controllers bind HTTP input, dispatch through `ISender`, and translate typed application results into HTTP responses.

```mermaid
flowchart LR
  Request[HTTP request] --> Auth[Authentication + policy]
  Auth --> Rate[Rate limiting + idempotency]
  Rate --> Controller[Thin endpoint]
  Controller --> CQRS[Command / Query]
  CQRS --> Pipeline[Validation + authorization behaviors]
  Pipeline --> Handler[Application handler]
  Handler --> Result[Typed Result]
  Result --> Response[Envelope / status code]
```

Use Swagger for the current contract. Collection endpoints use the shared pagination request when pagination is appropriate; pagination, filtering, sorting, and database access belong in the Application handler/repository, never in controllers. Authentication uses bearer tokens and scoped organization/region authorization. Error responses include a stable error code and trace correlation.
