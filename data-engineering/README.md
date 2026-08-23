# Data engineering

Independent Python workflows for ingestion, validation, normalization, quality checks, and analytical preparation. This package is decoupled from the .NET API and communicates through explicit storage and data contracts.

```mermaid
flowchart LR
  Source[Telemetry / CSV / external source] --> Ingest[Ingestion]
  Ingest --> Validate[Schema + quality validation]
  Validate --> Normalize[Units + timestamps]
  Normalize --> Store[(PostgreSQL / TimescaleDB)]
  Store --> Features[Analytical features]
  Features --> AI[AI service]
  Validate --> Reject[Rejected records + report]
```

## Layout

`src/water_operations_data` contains reusable Python code; `pipelines` contains executable workflows; `configs` contains non-secret configuration; `tests` contains unit and data-quality tests; `Output_Data` is generated local output.

```mermaid
stateDiagram-v2
  [*] --> Received
  Received --> Validating
  Validating --> Rejected: schema/range failure
  Validating --> Normalizing: valid
  Normalizing --> Persisted
  Persisted --> Published
  Rejected --> QualityReport
  Published --> [*]
  QualityReport --> [*]
```

Install test dependencies with `python -m pip install -e ".[test]"` and run `pytest`. Secrets belong in environment variables or the deployment secret store. Pipelines must be deterministic, explicit about units/timezones, and idempotent where possible.
