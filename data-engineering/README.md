# Data Engineering

Data ingestion, validation, transformation, quality, feature preparation, and analytical workflows for the Water Operations Intelligence Platform.

## Structure

```text
data-engineering/
├── src/       # Reusable data-engineering Python package
├── pipelines/ # Pipeline entry points and orchestration definitions
├── tests/     # Unit, data-quality, and pipeline tests
├── configs/   # Non-secret environment and pipeline configuration
└── README.md
```

This area is intentionally independent from the ASP.NET Core application and AI service. Pipelines communicate through explicit data contracts and storage boundaries. Secrets are supplied through environment variables or deployment secret stores.
