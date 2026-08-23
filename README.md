# Water Operations Intelligence Platform

Production-oriented platform for water telemetry, operational intelligence, alerting, and AI-assisted analysis. It combines a .NET API, React operations UI, optional AI service, independent data workflows, and deployment assets.

## Platform architecture

```mermaid
flowchart LR
  User[Viewer / Operator / Admin] --> UI[React Web App]
  UI -->|REST + SignalR| API[ASP.NET Core API]
  API --> APP[Application CQRS]
  APP --> DOMAIN[Domain rules]
  APP --> INFRA[Infrastructure adapters]
  INFRA --> PG[(PostgreSQL / TimescaleDB)]
  INFRA --> REDIS[(Redis)]
  INFRA --> JOBS[Hangfire / Outbox]
  DATA[Data pipelines] --> PG
  UI -. optional .-> AI[FastAPI AI service]
  API --> OBS[Health / metrics / logs]
```

```mermaid
mindmap
  root((Water Operations))
    backend
      Api
      Application
      Domain
      Infrastructure
      tests
    frontend
      features
      services
      components
    ai-service
      app
      tests
    data-engineering
      src
      pipelines
      configs
    infrastructure
      docker
      database
      deployment
      monitoring
```

## Technology stack

| Area | Technology | Responsibility |
|---|---|---|
| API | .NET 10, ASP.NET Core, MediatR | HTTP transport and use-case dispatch |
| Architecture | Clean Architecture + vertical slices | Dependency and business boundaries |
| Persistence | EF Core, PostgreSQL/TimescaleDB | Operational and time-series data |
| Cache/jobs | Redis, Hangfire, outbox | Cache, recurring work, reliable delivery |
| UI | React 19, TypeScript, Vite, TanStack Query | Operations and viewer experience |
| AI | Python 3.12, FastAPI | Optional intelligence capabilities |
| Delivery | Docker Compose, GitHub Actions | Local runtime and governed promotion |

## Request lifecycle

```mermaid
sequenceDiagram
  participant B as Browser
  participant M as API middleware
  participant C as Thin controller
  participant V as ValidationBehavior
  participant Z as AuthorizationBehavior
  participant H as Handler
  participant R as Repository port
  participant DB as PostgreSQL
  B->>M: HTTP request + bearer token
  M->>C: route binding
  C->>V: ISender.Send(command/query)
  V->>Z: validated request
  Z->>H: authorized request
  H->>R: scoped data access
  R->>DB: parameterized query
  DB-->>R: data
  R-->>H: DTO/result
  H-->>C: typed Result
  C-->>B: HTTP response
```

## Local quick start

Prerequisites: Docker Desktop with Compose v2, .NET 10 SDK, Node.js 20+ (Node 22 in CI), and Python 3.12 for AI/data services outside Docker.

```powershell
Copy-Item .env.example .env
.\scripts\dev.ps1
dotnet run --project backend/src/WaterOperations.Api --launch-profile http
npm --prefix frontend ci
npm --prefix frontend run dev
```

Use `./scripts/dev.sh` on macOS/Linux. Add `-WithAi` to start the optional AI container.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:5102 |
| Liveness | http://localhost:5102/health/live |
| Readiness | http://localhost:5102/health/ready |
| Swagger/OpenAPI | http://localhost:5102/swagger |
| Scalar | http://localhost:5102/scalar |
| AI health | http://localhost:8000/health |

## Configuration and security

Inject `ConnectionStrings__Default`, `ConnectionStrings__Redis`, `Authentication__SigningKey`, `Cors__AllowedOrigins__0`, `VITE_API_BASE_URL`, and `AI_SERVICE_URL` through local environment files or deployment secret stores. Never commit credentials; frontend variables are public after bundling.

```mermaid
flowchart LR
  Local[.env / user secrets] --> Dev[Local runtime]
  CI[GitHub environments] --> Release[Release workflow]
  Vault[Deployment secret store] --> Prod[Production runtime]
  Release --> Prod
```

## Quality gates

```mermaid
flowchart LR
  PR[Pull request] --> NET[.NET build + tests]
  PR --> WEB[Frontend lint + unit + browser + build]
  PR --> PY[AI + data pytest]
  NET --> Gate[Production readiness gate]
  WEB --> Gate
  PY --> Gate
  Gate --> Merge[Merge / release candidate]
```

```powershell
dotnet build backend/src/WaterOperations.slnx --configuration Release
dotnet test backend/src/WaterOperations.slnx --configuration Release
./scripts/verify-production-readiness.ps1
npm --prefix frontend run lint
npm --prefix frontend run format:check
npm --prefix frontend run test:unit -- --run
npm --prefix frontend run build
```

## Documentation index

- [Architecture](docs/architecture/README.md)
- [API guide](docs/api/README.md)
- [Development guide](docs/development/README.md)
- [Deployment and promotion](docs/deployment/README.md)
- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
- [AI service](ai-service/README.md)
- [Data engineering](data-engineering/README.md)
- [Database operations](infrastructure/database/README.md)
- [Docker runtime](infrastructure/docker/README.md)
- [Production readiness](docs/production-readiness/release-governance.md)
